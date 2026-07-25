/**
 * @file
 *
 * Shared integration suite that exercises New Note Fixer's headline user-facing feature end-to-end
 * against a real Obsidian: following a link to a non-existing note creates the note and (in the
 * "Ask for current note folder first" mode added for issue #5) lets the user place it in the current
 * note's folder via a confirm dialog that pre-fills the folder picker.
 *
 * The flow driven here is exactly the one a user drives: the plugin's `WorkspaceLeaf.openLinkText`
 * patch fires when the link is followed, the ODU `confirm` modal is answered with OK, and the
 * plugin's own fuzzy folder picker is accepted at its pre-filled current-note folder. The assertion
 * is the observable effect — the new note is created inside the current note's folder.
 *
 * Registered by the platform entry points (`plugin.desktop.integration.test.ts`,
 * `plugin.android.integration.test.ts`) so the identical flow runs on Desktop and Android (per G47 /
 * G97). The `*.integration.test.ts` name keeps it out of unit collection + coverage while matching no
 * `*.desktop`/`*.android` project glob, so it runs only when a platform entry point imports it.
 */

import { evalInObsidian } from 'obsidian-integration-testing';
import { getTempVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  describe,
  expect,
  it
} from 'vitest';

const PLUGIN_ID = 'new-note-fixer';
const ASK_MODE = 'Ask for current note folder first';
const SOURCE_FOLDER = 'nnf-projects';
const SOURCE_PATH = `${SOURCE_FOLDER}/nnf-source.md`;
const LINK_TEXT = 'nnf-brand-new-note';
const SOURCE_CONTENT = `[[${LINK_TEXT}]]`;
const EXPECTED_CREATED_PATH = `${SOURCE_FOLDER}/${LINK_TEXT}.md`;
const WAIT_TIMEOUT_IN_MILLISECONDS = 20_000;

interface ComponentNode {
  _children?: ComponentNode[];
  editAndSave?(settingsEditor: (settings: EditableSettings) => void): Promise<void>;
}

interface EditableSettings {
  newNoteLocationMode: string;
}

interface SettingsHost {
  editAndSave(settingsEditor: (settings: EditableSettings) => void): Promise<void>;
}

/**
 * Registers the "Ask for current note folder first" integration test for the given platform.
 *
 * @param platform - Human-readable platform label used in the test name (e.g. `'Desktop'`).
 */
export function registerNewNoteLocationSuite(platform: string): void {
  describe(`New note location - ask for current note folder first (${platform})`, () => {
    it('creates the new note in the current note folder when the confirm is accepted', async () => {
      const result = await evalInObsidian({
        args: {
          askMode: ASK_MODE,
          expectedCreatedPath: EXPECTED_CREATED_PATH,
          linkText: LINK_TEXT,
          pluginId: PLUGIN_ID,
          sourceContent: SOURCE_CONTENT,
          sourceFolder: SOURCE_FOLDER,
          sourcePath: SOURCE_PATH,
          waitTimeoutInMilliseconds: WAIT_TIMEOUT_IN_MILLISECONDS
        },
        async fn({
          app,
          askMode,
          expectedCreatedPath,
          lib: { waitUntil },
          linkText,
          obsidianModule,
          pluginId,
          sourceContent,
          sourceFolder,
          sourcePath,
          waitTimeoutInMilliseconds
        }) {
          async function cleanup(): Promise<void> {
            for (const path of [expectedCreatedPath, sourcePath, sourceFolder]) {
              const existing = app.vault.getAbstractFileByPath(path);
              if (existing) {
                await app.fileManager.trashFile(existing);
              }
            }
          }

          // The settings component is not a direct child of the plugin: PluginBase.addChild delegates
          // To an internal wrapper component, so it lives deeper in the `_children` tree. Search it.
          function findSettingsComponent(root: ComponentNode): SettingsHost | undefined {
            const stack: ComponentNode[] = [root];
            const seen = new Set<ComponentNode>();
            while (stack.length > 0) {
              const node = stack.pop();
              if (!node || seen.has(node)) {
                continue;
              }
              seen.add(node);
              if (typeof node.editAndSave === 'function') {
                return node as SettingsHost;
              }
              if (node._children) {
                stack.push(...node._children);
              }
            }
            return undefined;
          }

          await cleanup();

          await app.vault.createFolder(sourceFolder);
          const sourceFile = await app.vault.create(sourcePath, sourceContent);

          const plugin: unknown = app.plugins.getPlugin(pluginId);
          const settingsComponent = findSettingsComponent(plugin as ComponentNode);
          if (!settingsComponent) {
            await cleanup();
            return { createdPath: null, reason: 'settings component not found' };
          }
          await settingsComponent.editAndSave((settings) => {
            settings.newNoteLocationMode = askMode;
          });

          const leaf = app.workspace.getLeaf(true);
          await leaf.openFile(sourceFile, { state: { mode: 'source' } });
          await waitUntil({
            message: 'source note did not become the active view',
            predicate: () => app.workspace.getActiveViewOfType(obsidianModule.MarkdownView)?.file?.path === sourcePath,
            timeoutInMilliseconds: waitTimeoutInMilliseconds
          });

          // Following the link fires the patch, which awaits the confirm modal then the folder picker,
          // So the promise only settles after we drive both — do NOT await it before interacting.
          const openPromise = leaf.openLinkText(linkText, sourcePath);
          openPromise.catch(() => {
            // The patch's internal errors are surfaced via the file-existence assertion below.
          });

          await waitUntil({
            message: 'confirm modal did not open',
            predicate: () => document.querySelector('.confirm-modal .ok-button') !== null,
            timeoutInMilliseconds: waitTimeoutInMilliseconds
          });
          document.querySelector<HTMLElement>('.confirm-modal .ok-button')?.click();

          await waitUntil({
            message: 'folder picker did not open',
            predicate: () => document.querySelector('.prompt-results .suggestion-item') !== null,
            timeoutInMilliseconds: waitTimeoutInMilliseconds
          });
          document.querySelector<HTMLElement>('.prompt-results .suggestion-item')?.click();

          await openPromise.catch(() => {
            // Handled by the assertion below.
          });

          await waitUntil({
            message: 'new note was not created in the current note folder',
            predicate: () => app.vault.getAbstractFileByPath(expectedCreatedPath) !== null,
            timeoutInMilliseconds: waitTimeoutInMilliseconds
          });

          const createdPath = app.vault.getAbstractFileByPath(expectedCreatedPath)?.path ?? null;

          await cleanup();

          return { createdPath, reason: '' };
        },
        vaultPath: getTempVault().path
      });

      expect(result.reason).toBe('');
      expect(result.createdPath).toBe(EXPECTED_CREATED_PATH);
    });
  });
}
