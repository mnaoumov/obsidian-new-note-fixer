import type {
  App,
  OpenViewState,
  PluginManifest,
  TFolder,
  WorkspaceLeaf
} from 'obsidian';

import { WorkspaceLeaf as WorkspaceLeafClass } from 'obsidian';
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

const hoisted = vi.hoisted(() => ({
  mockEditLinks: vi.fn(),
  mockGenerateMarkdownLink: vi.fn(),
  mockNotice: vi.fn(),
  mockRegisterPatch: vi.fn(),
  mockSelectFolder: vi.fn()
}));

vi.mock('obsidian', async (importOriginal) => ({
  ...await importOriginal<typeof import('obsidian')>(),
  Notice: hoisted.mockNotice
}));

vi.mock('obsidian-dev-utils/obsidian/components/monkey-around-component', () => ({
  MonkeyAroundComponent: class MockMonkeyAroundComponent {
    public registerPatch = hoisted.mockRegisterPatch;
  }
}));

vi.mock('obsidian-dev-utils/obsidian/components/plugin-settings-tab-component', () => ({
  PluginSettingsTabComponent: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/data-handler', () => ({
  PluginDataHandler: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/link', () => ({
  editLinks: hoisted.mockEditLinks,
  generateMarkdownLink: hoisted.mockGenerateMarkdownLink
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin-event-source', () => ({
  PluginEventSourceImpl: vi.fn()
}));

vi.mock('./folder-selector.ts', () => ({
  selectFolder: hoisted.mockSelectFolder
}));

vi.mock('./plugin-settings-component.ts', () => ({
  PluginSettingsComponent: class MockPluginSettingsComponent {
    public settings = { shouldPromptForFolderLocation: false };
  }
}));

vi.mock('./plugin-settings-tab.ts', () => ({
  PluginSettingsTab: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede the SUT import.
import { Plugin } from './plugin.ts';

interface CreatePluginOptions {
  readonly getFirstLinkpathDest?: App['metadataCache']['getFirstLinkpathDest'];
  readonly newFileParentPath?: string;
  readonly shouldPromptForFolderLocation?: boolean;
}

interface CreatePluginResult {
  readonly internals: PluginInternals;
  readonly plugin: Plugin;
}

interface LinkInfo {
  link: string;
  original: string;
}

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

interface PluginInternals {
  onloadImpl(): void;
  openLinkText(next: OpenLinkTextFn, leaf: WorkspaceLeaf, linktext: string, sourcePath: string, openViewState?: OpenViewState): Promise<void>;
  pluginSettingsComponent: SettingsComponentStub;
}

interface SettingsComponentStub {
  settings: SettingsStub;
}

interface SettingsStub {
  shouldPromptForFolderLocation: boolean;
}

const DEFAULT_NEW_FILE_PARENT_PATH = 'notes';

function createPlugin(options: CreatePluginOptions = {}): CreatePluginResult {
  const getFirstLinkpathDest = options.getFirstLinkpathDest ?? vi.fn().mockReturnValue(null);
  const app = strictProxy<App>({
    fileManager: strictProxy<App['fileManager']>({
      getNewFileParent: vi.fn().mockReturnValue({ path: options.newFileParentPath ?? DEFAULT_NEW_FILE_PARENT_PATH })
    }),
    metadataCache: strictProxy<App['metadataCache']>({
      getFirstLinkpathDest
    })
  });
  const plugin = new Plugin(app, strictProxy<PluginManifest>({ id: 'test', name: 'test' }));
  const internals = castTo<PluginInternals>(plugin);
  internals.pluginSettingsComponent = { settings: { shouldPromptForFolderLocation: options.shouldPromptForFolderLocation ?? false } };
  return { internals, plugin };
}

describe('Plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should add three children and patch WorkspaceLeaf.openLinkText in onloadImpl', () => {
    const plugin = new Plugin(strictProxy<App>({}), strictProxy<PluginManifest>({ id: 'test', name: 'test' }));
    const addChildSpy = vi.spyOn(plugin, 'addChild');

    castTo<PluginInternals>(plugin).onloadImpl();

    const EXPECTED_CHILD_COUNT = 3;
    expect(addChildSpy).toHaveBeenCalledTimes(EXPECTED_CHILD_COUNT);
    expect(hoisted.mockRegisterPatch).toHaveBeenCalledWith(WorkspaceLeafClass.prototype, expect.anything());
  });
});

describe('Plugin.openLinkText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should pass through when the linked file already exists', async () => {
    const existingFile = { path: 'notes/test.md' };
    const { internals } = createPlugin({ getFirstLinkpathDest: vi.fn().mockReturnValue(existingFile) });
    const next = vi.fn();

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(next).toHaveBeenCalledWith('test', 'source.md', undefined);
  });

  it('should use the absolute path when the link starts with a slash', async () => {
    const { internals } = createPlugin();
    const next = vi.fn();

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), '/notes/test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should resolve relative paths against the new file parent', async () => {
    const { internals } = createPlugin();
    const next = vi.fn();

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should show an error for a wrong relative path starting with ../', async () => {
    const { internals } = createPlugin({ newFileParentPath: '.' });
    const next = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), '../other/test', 'source.md');

    expect(hoisted.mockNotice).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(next).not.toHaveBeenCalled();
  });

  it('should prompt for a folder when shouldPromptForFolderLocation is true', async () => {
    const { internals } = createPlugin({ shouldPromptForFolderLocation: true });
    const next = vi.fn();
    hoisted.mockSelectFolder.mockResolvedValue(strictProxy<TFolder>({ path: 'selected' }));

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith('/selected/test', 'source.md', undefined);
  });

  it('should return early when the user cancels the folder selection', async () => {
    const { internals } = createPlugin({ shouldPromptForFolderLocation: true });
    const next = vi.fn();
    hoisted.mockSelectFolder.mockResolvedValue(null);

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(next).not.toHaveBeenCalled();
  });

  it('should use the root as the default folder when the directory resolves to a dot', async () => {
    const { internals } = createPlugin({ newFileParentPath: '.', shouldPromptForFolderLocation: true });
    const next = vi.fn();
    hoisted.mockSelectFolder.mockResolvedValue(strictProxy<TFolder>({ path: 'root' }));

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalledWith(expect.anything(), '/');
    expect(next).toHaveBeenCalledWith('/root/test', 'source.md', undefined);
  });

  it('should edit links when the created file differs from the original linked file', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(null);
    const { internals } = createPlugin({ getFirstLinkpathDest });
    const next = vi.fn();
    hoisted.mockEditLinks.mockResolvedValue(undefined);

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
  });

  it('should not edit links when the created file matches the original linked file', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(createdFile);
    const { internals } = createPlugin({ getFirstLinkpathDest });
    const next = vi.fn();

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(hoisted.mockEditLinks).not.toHaveBeenCalled();
  });

  it('should include the subpath in the link passed to next', async () => {
    const { internals } = createPlugin();
    const next = vi.fn();

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test#heading', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test#heading', 'source.md', undefined);
  });

  it('should generate a markdown link only for the matching original link', async () => {
    const createdFile = { path: 'notes/test.md' };
    const getFirstLinkpathDest = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(createdFile)
      .mockReturnValueOnce(null);
    const { internals, plugin } = createPlugin({ getFirstLinkpathDest });
    const next = vi.fn();
    hoisted.mockGenerateMarkdownLink.mockReturnValue('[[notes/test]]');
    hoisted.mockEditLinks.mockImplementation((_app: unknown, _sourcePath: string, callback: (link: LinkInfo) => unknown): void => {
      expect(callback({ link: 'test', original: '[[test]]' })).toBe('[[notes/test]]');
      expect(callback({ link: 'other', original: '[[other]]' })).toBeUndefined();
    });

    await internals.openLinkText(next, strictProxy<WorkspaceLeaf>({}), 'test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
    expect(hoisted.mockGenerateMarkdownLink).toHaveBeenCalledWith({
      app: plugin.app,
      originalLink: '[[test]]',
      sourcePathOrFile: 'source.md',
      targetPathOrFile: createdFile
    });
  });
});
