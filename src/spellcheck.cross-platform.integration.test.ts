/**
 * @file
 *
 * Spell checking the folder picker's box against a real Obsidian, which is the only place the starting
 * point can be observed: Obsidian builds every `SuggestModal` input with a hardcoded
 * `spellcheck="false"` and never consults `Editor > Spellcheck` there, and `obsidian-test-mocks` does not
 * reproduce that.
 *
 * The picker always offers to CREATE the folder named in its box — the top row is `Enter to create`, and
 * what is typed goes straight to `vault.createFolder` — so it is a name field at all times and follows the
 * setting the way Obsidian's own inline rename does.
 *
 * The picker is reached the way a user reaches it: follow a link to a non-existing note in the
 * "Ask for current note folder first" mode, answer the confirm, and the picker opens.
 *
 * Named `*.cross-platform.integration.test.ts` (per G47), so the desktop AND android projects both
 * collect it.
 */

import { evalInObsidian } from 'obsidian-integration-testing';
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  describe,
  expect,
  it
} from 'vitest';

const PLUGIN_ID = 'new-note-fixer';
const ASK_MODE = 'Ask for current note folder first';
const SOURCE_FOLDER = 'nnf-spellcheck';
const SOURCE_PATH = `${SOURCE_FOLDER}/nnf-spellcheck-source.md`;
const LINK_TEXT = 'nnf-spellcheck-target';
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

describe('spell checking the folder picker box', () => {
  it('follows the vault setting, because the box names the folder it will create', async () => {
    const result = await evalInObsidian({
      async callback({
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
        const originalSpellcheck = app.vault.getConfig('spellcheck');

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

        /**
         * Drives the whole flow once and reports what the picker's box carried.
         *
         * @param isSpellcheckEnabled - What `Editor > Spellcheck` is set to for this run.
         * @returns The `spellcheck` attribute on the picker's input.
         */
        async function readSpellcheckAttribute(isSpellcheckEnabled: boolean): Promise<null | string> {
          await cleanup();
          app.vault.setConfig('spellcheck', isSpellcheckEnabled);

          await app.vault.createFolder(sourceFolder);
          const sourceFile = await app.vault.create(sourcePath, sourceContent);

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
            // The patch's internal errors would surface as a picker that never opens, which the waits below report.
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

          const spellcheckAttribute = document.querySelector('.prompt-input')?.getAttribute('spellcheck') ?? null;

          document.querySelector<HTMLElement>('.prompt-results .suggestion-item')?.click();
          await openPromise.catch(() => {
            // Already reported by the waits above.
          });

          return spellcheckAttribute;
        }

        try {
          const plugin: unknown = app.plugins.getPlugin(pluginId);
          const settingsComponent = findSettingsComponent(plugin as ComponentNode);
          if (!settingsComponent) {
            return { reason: 'settings component not found', whenDisabled: null, whenEnabled: null };
          }
          await settingsComponent.editAndSave((settings) => {
            settings.newNoteLocationMode = askMode;
          });

          // Read in both directions on purpose: a single reading with the setting ON is indistinguishable
          // From a box that is simply always checked, so only the pair proves it FOLLOWS the setting.
          const whenEnabled = await readSpellcheckAttribute(true);
          const whenDisabled = await readSpellcheckAttribute(false);

          return { reason: '', whenDisabled, whenEnabled };
        } finally {
          app.vault.setConfig('spellcheck', originalSpellcheck);
          await cleanup();
        }
      },
      input: {
        askMode: ASK_MODE,
        expectedCreatedPath: EXPECTED_CREATED_PATH,
        linkText: LINK_TEXT,
        pluginId: PLUGIN_ID,
        sourceContent: SOURCE_CONTENT,
        sourceFolder: SOURCE_FOLDER,
        sourcePath: SOURCE_PATH,
        waitTimeoutInMilliseconds: WAIT_TIMEOUT_IN_MILLISECONDS
      },
      vaultPath: getTemporaryVault().path
    });

    expect(result.reason).toBe('');
    expect(result.whenEnabled).toBe('true');
    expect(result.whenDisabled).toBe('false');
  });
});
