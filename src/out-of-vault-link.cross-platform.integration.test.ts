/**
 * @file
 *
 * Integration suite for the out-of-vault refusal that `demo-vault/02 Relative link fix.md` promises:
 * in the `Default location` mode, following a `../` link that climbs above the vault root to a
 * non-existing note shows `Wrong relative path: <link>` and creates nothing.
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
const SOURCE_PATH = 'nnf-out-of-vault.md';
const LINK_TEXT = '../Outside vault/Stray note';
const SOURCE_CONTENT = `[[${LINK_TEXT}]]`;
const EXPECTED_NOTICE = `Wrong relative path: ${LINK_TEXT}`;
// Every wait here is a view activating or a notice appearing, which lands in well under a second.
const WAIT_TIMEOUT_IN_MILLISECONDS = 6000;

interface ComponentNode {
  _children?: ComponentNode[];
  editAndSave?: (settingsEditor: (settings: EditableSettings) => void) => Promise<void>;
}

interface EditableSettings {
  newNoteLocationMode: string;
}

interface SettingsHost {
  editAndSave: (settingsEditor: (settings: EditableSettings) => void) => Promise<void>;
}

describe('Out-of-vault relative link to a non-existing note', () => {
  it('shows the wrong-relative-path notice and creates nothing', async () => {
    const result = await evalInObsidian({
      async callback({
        app,
        defaultMode,
        expectedNotice,
        lib: { waitUntil },
        linkText,
        obsidianModule,
        pluginId,
        sourceContent,
        sourcePath,
        waitTimeoutInMilliseconds
      }) {
        async function cleanup(): Promise<void> {
          const existing = app.vault.getAbstractFileByPath(sourcePath);
          if (existing) {
            await app.fileManager.trashFile(existing);
          }
        }

        function hasNotice(): boolean {
          return [...activeDocument.querySelectorAll('.notice')].some((notice) => notice.textContent.includes(expectedNotice));
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

        const sourceFile = await app.vault.create(sourcePath, sourceContent);
        const fileCountBefore = app.vault.getAllLoadedFiles().length;

        const plugin: unknown = app.plugins.getPlugin(pluginId);
        const settingsComponent = findSettingsComponent(plugin as ComponentNode);
        if (!settingsComponent) {
          await cleanup();
          return { createdFileCount: 0, hasNotice: false, reason: 'settings component not found' };
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
          message: 'the wrong-relative-path notice did not appear',
          predicate: hasNotice,
          timeoutInMilliseconds: waitTimeoutInMilliseconds
        });

        const createdFileCount = app.vault.getAllLoadedFiles().length - fileCountBefore;

        await cleanup();

        return { createdFileCount, hasNotice: true, reason: '' };
      },
      input: {
        defaultMode: DEFAULT_MODE,
        expectedNotice: EXPECTED_NOTICE,
        linkText: LINK_TEXT,
        pluginId: PLUGIN_ID,
        sourceContent: SOURCE_CONTENT,
        sourcePath: SOURCE_PATH,
        waitTimeoutInMilliseconds: WAIT_TIMEOUT_IN_MILLISECONDS
      },
      vaultPath: getTemporaryVault().path
    });

    expect(result.reason).toBe('');
    expect(result.hasNotice).toBe(true);
    expect(result.createdFileCount).toBe(0);
  });
});
