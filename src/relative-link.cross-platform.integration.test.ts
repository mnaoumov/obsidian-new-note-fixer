/**
 * @file
 *
 * Integration suite for issue #2: following a Markdown link whose path starts with `./` to a
 * non-existing note creates the note relative to the linking note's folder, not relative to the
 * configured default new-note folder — and creates the missing intermediate folder on the way.
 *
 * The steps are the reporter's own: a note at `<folder>/Project/Project.md` links
 * `[Note](./Assets/Note.md)`, `Assets` does not exist yet, and the link is followed.
 *
 * Named `*.cross-platform.integration.test.ts`, so the desktop AND android projects both
 * collect it and the same flow is verified on each.
 */

import { evalInObsidian } from 'obsidian-integration-testing';
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  describe,
  expect,
  it
} from 'vitest';

const PLUGIN_ID = 'new-note-fixer';
const DEFAULT_MODE = 'Default location';
const ROOT_FOLDER = 'nnf-relative';
const SOURCE_FOLDER = `${ROOT_FOLDER}/Project`;
const SOURCE_PATH = `${SOURCE_FOLDER}/Project.md`;
const LINK_TEXT = './Assets/Note.md';
const SOURCE_CONTENT = `[Note](${LINK_TEXT})`;
const EXPECTED_CREATED_PATH = `${SOURCE_FOLDER}/Assets/Note.md`;
// Every wait here is a view activating or a file appearing, which lands in well under a second.
const WAIT_TIMEOUT_IN_MILLISECONDS = 6000;

interface ComponentNode {
  readonly _children?: ComponentNode[];
  readonly editAndSave?: (settingsEditor: (settings: EditableSettings) => void) => Promise<void>;
}

interface EditableSettings {
  // eslint-disable-next-line typescript-dev-toolkit/readonly-interface-members -- Tests change the live setting to exercise each location mode.
  newNoteLocationMode: string;
}

interface SettingsHost {
  readonly editAndSave: (settingsEditor: (settings: EditableSettings) => void) => Promise<void>;
}

describe('Relative link to a non-existing note', () => {
  it('creates the note relative to the linking note folder, creating the missing folder', async () => {
    const result = await evalInObsidian({
      async callback({
        app,
        defaultMode,
        expectedCreatedPath,
        lib: { waitUntil },
        linkText,
        obsidianModule,
        pluginId,
        rootFolder,
        sourceContent,
        sourceFolder,
        sourcePath,
        waitTimeoutInMilliseconds
      }) {
        async function cleanup(): Promise<void> {
          const existing = app.vault.getAbstractFileByPath(rootFolder);
          if (existing) {
            await app.fileManager.trashFile(existing);
          }
        }

        // The settings component is not a direct child of the plugin: PluginBase.addChild delegates
        // to an internal wrapper component, so it lives deeper in the `_children` tree. Search it.
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
          settings.newNoteLocationMode = defaultMode;
        });

        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(sourceFile, { state: { mode: 'source' } });
        await waitUntil({
          message: 'source note did not become the active view',
          predicate: () => app.workspace.getActiveViewOfType(obsidianModule.MarkdownView)?.file?.path === sourcePath,
          timeoutInMilliseconds: waitTimeoutInMilliseconds
        });

        await leaf.openLinkText(linkText, sourcePath);

        await waitUntil({
          message: 'new note was not created relative to the linking note folder',
          predicate: () => app.vault.getAbstractFileByPath(expectedCreatedPath) !== null,
          timeoutInMilliseconds: waitTimeoutInMilliseconds
        });

        const createdPath = app.vault.getAbstractFileByPath(expectedCreatedPath)?.path ?? null;

        await cleanup();

        return { createdPath, reason: '' };
      },
      input: {
        defaultMode: DEFAULT_MODE,
        expectedCreatedPath: EXPECTED_CREATED_PATH,
        linkText: LINK_TEXT,
        pluginId: PLUGIN_ID,
        rootFolder: ROOT_FOLDER,
        sourceContent: SOURCE_CONTENT,
        sourceFolder: SOURCE_FOLDER,
        sourcePath: SOURCE_PATH,
        waitTimeoutInMilliseconds: WAIT_TIMEOUT_IN_MILLISECONDS
      },
      vaultPath: getTemporaryVault().path
    });

    expect(result.reason).toBe('');
    expect(result.createdPath).toBe(EXPECTED_CREATED_PATH);
  });
});
