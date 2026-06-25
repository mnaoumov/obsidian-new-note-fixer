import type {
  App,
  OpenViewState,
  TFolder,
  WorkspaceLeaf as WorkspaceLeafType
} from 'obsidian';

import { WorkspaceLeaf } from 'obsidian';
import { noop } from 'obsidian-dev-utils/function';
import { castTo } from 'obsidian-dev-utils/object-utils';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import type { PluginSettingsComponent } from '../plugin-settings-component.ts';
import type { PluginSettings } from '../plugin-settings.ts';

/**
 * The component is driven through the REAL `MonkeyAroundComponent` from
 * `obsidian-dev-utils` (never mocked): `component.load()` really patches
 * `WorkspaceLeaf.prototype.openLinkText`, and the test asserts by invoking the
 * really-patched method. `WorkspaceLeaf.openLinkText` is an Obsidian-internal
 * member the `obsidian-test-mocks` shell does not model, so we supplement it
 * with a `vi.fn()` that doubles as the original method (the `next` handler the
 * patch wraps) — a sanctioned return-value/behavior supplement, not a
 * re-implementation of any dev-utils / test-mocks logic.
 *
 * Only the plugin's OWN sibling module (`folder-selector`) and the dev-utils
 * `link` utilities (`editLinks` / `generateMarkdownLink`) and `Notice` are
 * stubbed for their return values — driving those for real would require a full
 * vault with file contents.
 */

const hoisted = vi.hoisted(() => ({
  mockEditLinks: vi.fn(),
  mockGenerateMarkdownLink: vi.fn(),
  mockNotice: vi.fn(),
  mockSelectFolder: vi.fn()
}));

vi.mock('obsidian', async (importOriginal) => ({
  ...await importOriginal<typeof import('obsidian')>(),
  Notice: hoisted.mockNotice
}));

vi.mock('obsidian-dev-utils/obsidian/link', async (importOriginal) => ({
  ...await importOriginal<typeof import('obsidian-dev-utils/obsidian/link')>(),
  editLinks: hoisted.mockEditLinks,
  generateMarkdownLink: hoisted.mockGenerateMarkdownLink
}));

vi.mock('../folder-selector.ts', () => ({
  selectFolder: hoisted.mockSelectFolder
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede the SUT import.
import { WorkspaceLeafOpenLinkTextPatchComponent } from './workspace-leaf-open-link-text-patch-component.ts';

interface CreateComponentOptions {
  readonly getFirstLinkpathDest?: App['metadataCache']['getFirstLinkpathDest'];
  readonly newFileParentPath?: string;
  readonly shouldPromptForFolderLocation?: boolean;
}

interface CreateComponentResult {
  readonly app: App;
  readonly next: ReturnType<typeof vi.fn>;
  openLinkText(linktext: string, sourcePath: string, openViewState?: OpenViewState): Promise<void>;
}

interface LinkInfo {
  link: string;
  original: string;
}

type OpenLinkTextFn = WorkspaceLeafType['openLinkText'];

interface PatchedProto {
  openLinkText: OpenLinkTextFn;
}

const DEFAULT_NEW_FILE_PARENT_PATH = 'notes';

const loadedComponents: WorkspaceLeafOpenLinkTextPatchComponent[] = [];
const patchedProto = castTo<PatchedProto>(WorkspaceLeaf.prototype);

describe('WorkspaceLeafOpenLinkTextPatchComponent', () => {
  afterEach(() => {
    while (loadedComponents.length > 0) {
      loadedComponents.pop()?.unload();
    }
    // Remove the supplemented Obsidian-internal method to avoid cross-file prototype leakage.
    delete castTo<Partial<PatchedProto>>(WorkspaceLeaf.prototype).openLinkText;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should pass through when the linked file already exists', async () => {
    const existingFile = { path: 'notes/test.md' };
    const { next, openLinkText } = createComponent({ getFirstLinkpathDest: vi.fn().mockReturnValue(existingFile) });

    await openLinkText('test', 'source.md');

    expect(next).toHaveBeenCalledWith('test', 'source.md', undefined);
  });

  it('should use the absolute path when the link starts with a slash', async () => {
    const { next, openLinkText } = createComponent();

    await openLinkText('/notes/test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should resolve relative paths against the new file parent', async () => {
    const { next, openLinkText } = createComponent();

    await openLinkText('test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should show an error for a wrong relative path starting with ../', async () => {
    const { next, openLinkText } = createComponent({ newFileParentPath: '.' });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);

    await openLinkText('../other/test', 'source.md');

    expect(hoisted.mockNotice).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(next).not.toHaveBeenCalled();
  });

  it('should prompt for a folder when shouldPromptForFolderLocation is true', async () => {
    const { next, openLinkText } = createComponent({ shouldPromptForFolderLocation: true });
    hoisted.mockSelectFolder.mockResolvedValue(strictProxy<TFolder>({ path: 'selected' }));

    await openLinkText('test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith('/selected/test', 'source.md', undefined);
  });

  it('should return early when the user cancels the folder selection', async () => {
    const { next, openLinkText } = createComponent({ shouldPromptForFolderLocation: true });
    hoisted.mockSelectFolder.mockResolvedValue(null);

    await openLinkText('test', 'source.md');

    expect(next).not.toHaveBeenCalled();
  });

  it('should use the root as the default folder when the directory resolves to a dot', async () => {
    const { next, openLinkText } = createComponent({ newFileParentPath: '.', shouldPromptForFolderLocation: true });
    hoisted.mockSelectFolder.mockResolvedValue(strictProxy<TFolder>({ path: 'root' }));

    await openLinkText('test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalledWith(expect.anything(), '/');
    expect(next).toHaveBeenCalledWith('/root/test', 'source.md', undefined);
  });

  it('should edit links when the created file differs from the original linked file', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(null);
    const { openLinkText } = createComponent({ getFirstLinkpathDest });
    hoisted.mockEditLinks.mockResolvedValue(undefined);

    await openLinkText('test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
  });

  it('should not edit links when the created file matches the original linked file', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(createdFile);
    const { openLinkText } = createComponent({ getFirstLinkpathDest });

    await openLinkText('test', 'source.md');

    expect(hoisted.mockEditLinks).not.toHaveBeenCalled();
  });

  it('should include the subpath in the link passed to next', async () => {
    const { next, openLinkText } = createComponent();

    await openLinkText('test#heading', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test#heading', 'source.md', undefined);
  });

  it('should generate a markdown link only for the matching original link', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(null);
    const { app, openLinkText } = createComponent({ getFirstLinkpathDest });
    hoisted.mockGenerateMarkdownLink.mockReturnValue('[[notes/test]]');
    hoisted.mockEditLinks.mockImplementation((_app: unknown, _sourcePath: string, callback: (link: LinkInfo) => unknown): void => {
      expect(callback({ link: 'test', original: '[[test]]' })).toBe('[[notes/test]]');
      expect(callback({ link: 'other', original: '[[other]]' })).toBeUndefined();
    });

    await openLinkText('test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
    expect(hoisted.mockGenerateMarkdownLink).toHaveBeenCalledWith({
      app,
      originalLink: '[[test]]',
      sourcePathOrFile: 'source.md',
      targetPathOrFile: createdFile
    });
  });
});

function createComponent(options: CreateComponentOptions = {}): CreateComponentResult {
  const app = strictProxy<App>({
    fileManager: strictProxy<App['fileManager']>({
      getNewFileParent: vi.fn().mockReturnValue({ path: options.newFileParentPath ?? DEFAULT_NEW_FILE_PARENT_PATH })
    }),
    metadataCache: strictProxy<App['metadataCache']>({
      getFirstLinkpathDest: options.getFirstLinkpathDest ?? vi.fn().mockReturnValue(null)
    })
  });
  const pluginSettingsComponent = strictProxy<PluginSettingsComponent>({
    settings: strictProxy<PluginSettings>({ shouldPromptForFolderLocation: options.shouldPromptForFolderLocation ?? false })
  });

  /*
   * Supplement the not-modeled `WorkspaceLeaf.openLinkText` BEFORE loading so the real
   * `registerMethodPatch` captures it as the original method (the `next` handler).
   */
  const next = vi.fn();
  patchedProto.openLinkText = next;

  const component = new WorkspaceLeafOpenLinkTextPatchComponent({ app, pluginSettingsComponent });
  component.load();
  loadedComponents.push(component);

  return {
    app,
    next,
    async openLinkText(linktext, sourcePath, openViewState): Promise<void> {
      await patchedProto.openLinkText.call(strictProxy<WorkspaceLeafType>({}), linktext, sourcePath, openViewState);
    }
  };
}
