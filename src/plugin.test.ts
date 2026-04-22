import type { TFolder } from 'obsidian';
import type { RegisterComponentParams } from 'obsidian-dev-utils/obsidian/plugin/plugin';

import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

const registeredComponents: RegisterComponentParams[] = [];

const hoisted = vi.hoisted(() => ({
  mockBasename: vi.fn(),
  mockDirname: vi.fn(),
  mockEditLinks: vi.fn(),
  mockGenerateMarkdownLink: vi.fn(),
  mockJoin: vi.fn(),
  mockNotice: vi.fn(),
  mockParseLinktext: vi.fn(),
  mockRegisterPatch: vi.fn(),
  mockSelectFolder: vi.fn()
}));

const PluginBaseMock = vi.hoisted(() =>
  class {
    public app: unknown;
    public manifest: unknown;

    public constructor(app: unknown, manifest: unknown) {
      this.app = app;
      this.manifest = manifest;
    }

    public loadData(): unknown {
      return undefined;
    }

    public saveData(): unknown {
      return undefined;
    }

    protected async onloadImpl(): Promise<void> {
      /* Base no-op */
    }

    protected registerComponent(params: RegisterComponentParams): unknown {
      registeredComponents.push(params);
      return params.component;
    }
  }
);

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: PluginBaseMock
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/components/plugin-settings-tab-component', () => ({
  PluginSettingsTabComponent: class MockPluginSettingsTabComponent {
    public constructor(public plugin: unknown, public tab: unknown) {}
  }
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/components/plugin-settings-component', () => ({
  PluginSettingsComponentBase: class MockPluginSettingsComponentBase {
    public settings = { shouldPromptForFolderLocation: false };
  }
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin-settings-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class -- mock class must exist for extends.
  PluginSettingsTabBase: class MockPluginSettingsTabBase {}
}));

vi.mock('obsidian-dev-utils/obsidian/setting-ex', () => ({
  SettingEx: vi.fn()
}));

vi.mock('obsidian', () => ({
  FuzzySuggestModal: vi.fn(),
  Notice: hoisted.mockNotice,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  parseLinktext: (...args: unknown[]) => hoisted.mockParseLinktext(...args),
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class -- mock class must exist for prototype access.
  WorkspaceLeaf: class MockWorkspaceLeaf {}
}));

vi.mock('obsidian-dev-utils/obsidian/link', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  editLinks: (...args: unknown[]) => hoisted.mockEditLinks(...args),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  generateMarkdownLink: (...args: unknown[]) => hoisted.mockGenerateMarkdownLink(...args)
}));

vi.mock('obsidian-dev-utils/obsidian/monkey-around', () => ({
  registerPatch: hoisted.mockRegisterPatch
}));

vi.mock('obsidian-dev-utils/path', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  basename: (...args: unknown[]) => hoisted.mockBasename(...args),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  dirname: (...args: unknown[]) => hoisted.mockDirname(...args),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  join: (...args: unknown[]) => hoisted.mockJoin(...args)
}));

vi.mock('obsidian-dev-utils/async', () => ({
  invokeAsyncSafely: vi.fn()
}));

vi.mock('./folder-selector.ts', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  selectFolder: (...args: unknown[]) => hoisted.mockSelectFolder(...args)
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin } from './plugin.ts';

interface MockMetadataCache {
  getFirstLinkpathDest: ReturnType<typeof vi.fn>;
}

interface MockSettingsComponent {
  settings: Record<string, unknown>;
}

interface SettingsOverrides {
  shouldPromptForFolderLocation?: boolean;
}

function createPlugin(settingsOverrides?: SettingsOverrides): Plugin {
  const mockApp = {
    fileManager: {
      getNewFileParent: vi.fn().mockReturnValue({ path: 'notes' })
    },
    metadataCache: {
      getFirstLinkpathDest: vi.fn().mockReturnValue(null)
    }
  };
  const mockManifest = { id: 'new-note-fixer' };

  registeredComponents.length = 0;
  const plugin = new Plugin(mockApp as never, mockManifest as never);

  if (settingsOverrides) {
    // eslint-disable-next-line no-restricted-syntax -- test helper needs double assertion to cast Component to mock type.
    const settingsComponent = registeredComponents.at(0)?.component as unknown as MockSettingsComponent | undefined;
    if (settingsComponent) {
      Object.assign(settingsComponent.settings, settingsOverrides);
    }
  }

  return plugin;
}

function setMetadataCache(plugin: Plugin, metadataCache: MockMetadataCache): void {
  // eslint-disable-next-line no-restricted-syntax -- test helper needs dynamic property assignment on mock app.
  (plugin.app as unknown as Record<string, unknown>)['metadataCache'] = metadataCache;
}

describe('Plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should register two components', () => {
    registeredComponents.length = 0;
    new Plugin({} as never, { id: 'test' } as never);

    const EXPECTED_COMPONENT_COUNT = 2;
    expect(registeredComponents).toHaveLength(EXPECTED_COMPONENT_COUNT);
  });

  it('should register PluginSettingsComponent with shouldPreload true', () => {
    registeredComponents.length = 0;
    new Plugin({} as never, { id: 'test' } as never);

    const settingsComponent = registeredComponents.at(0);
    expect(settingsComponent?.shouldPreload).toBe(true);
  });

  it('should register PluginSettingsTabComponent without shouldPreload', () => {
    registeredComponents.length = 0;
    new Plugin({} as never, { id: 'test' } as never);

    const tabComponent = registeredComponents.at(1);
    expect(tabComponent?.shouldPreload).toBeUndefined();
  });

  it('should call registerPatch in onloadImpl', async () => {
    const plugin = new Plugin({} as never, { id: 'test' } as never);
    await plugin['onloadImpl']();

    expect(hoisted.mockRegisterPatch).toHaveBeenCalled();
  });
});

describe('Plugin.openLinkText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should pass through when linked file exists', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;
    const existingFile = { path: 'notes/test.md' };

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    setMetadataCache(plugin, {
      getFirstLinkpathDest: vi.fn().mockReturnValue(existingFile)
    });

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(next).toHaveBeenCalledWith('test', 'source.md', undefined);
  });

  it('should use absolute path when link starts with /', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;

    hoisted.mockParseLinktext.mockReturnValue({ path: '/notes/test', subpath: '' });

    await plugin['openLinkText'](next, leaf, '/notes/test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should use getNewFileParent for relative paths', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('notes/test');

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test', 'source.md', undefined);
  });

  it('should show error for wrong relative path starting with ../', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;

    hoisted.mockParseLinktext.mockReturnValue({ path: '../other/test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('../other/test');
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentionally suppress console.error output in test.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await plugin['openLinkText'](next, leaf, '../other/test', 'source.md');

    expect(hoisted.mockNotice).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Wrong relative path: ../other/test');
    expect(next).not.toHaveBeenCalled();
  });

  it('should prompt for folder when shouldPromptForFolderLocation is true', async () => {
    const plugin = createPlugin({ shouldPromptForFolderLocation: true });
    const next = vi.fn();
    const leaf = {} as never;

    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
    const selectedFolder = { path: 'selected' } as TFolder;

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValueOnce('notes/test').mockReturnValueOnce('selected/test');
    hoisted.mockDirname.mockReturnValue('notes');
    hoisted.mockBasename.mockReturnValue('test');
    hoisted.mockSelectFolder.mockResolvedValue(selectedFolder);

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith('/selected/test', 'source.md', undefined);
  });

  it('should return early when user cancels folder selection', async () => {
    const plugin = createPlugin({ shouldPromptForFolderLocation: true });
    const next = vi.fn();
    const leaf = {} as never;

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('notes/test');
    hoisted.mockDirname.mockReturnValue('notes');
    hoisted.mockSelectFolder.mockResolvedValue(null);

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(next).not.toHaveBeenCalled();
  });

  it('should use / as default dir when dirname returns .', async () => {
    const plugin = createPlugin({ shouldPromptForFolderLocation: true });
    const next = vi.fn();
    const leaf = {} as never;

    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
    const selectedFolder = { path: 'root' } as TFolder;

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValueOnce('test').mockReturnValueOnce('root/test');
    hoisted.mockDirname.mockReturnValue('.');
    hoisted.mockBasename.mockReturnValue('test');
    hoisted.mockSelectFolder.mockResolvedValue(selectedFolder);

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(hoisted.mockSelectFolder).toHaveBeenCalledWith(expect.anything(), '/');
  });

  it('should edit links when created file differs from original linked file', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;
    const createdFile = { path: 'notes/test.md' };

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('notes/test');

    setMetadataCache(plugin, {
      getFirstLinkpathDest: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(createdFile)
        .mockReturnValueOnce(null)
    });
    hoisted.mockEditLinks.mockResolvedValue(undefined);

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
  });

  it('should not edit links when created file matches original linked file', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;
    const createdFile = { path: 'notes/test.md' };

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('notes/test');

    setMetadataCache(plugin, {
      getFirstLinkpathDest: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(createdFile)
        .mockReturnValueOnce(createdFile)
    });

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(hoisted.mockEditLinks).not.toHaveBeenCalled();
  });

  it('should include subpath in the link when calling next', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '#heading' });
    hoisted.mockJoin.mockReturnValue('notes/test');

    await plugin['openLinkText'](next, leaf, 'test#heading', 'source.md');

    expect(next).toHaveBeenCalledWith('/notes/test#heading', 'source.md', undefined);
  });

  it('should handle editLinks callback correctly for matching link', async () => {
    const plugin = createPlugin();
    const next = vi.fn();
    const leaf = {} as never;
    const createdFile = { path: 'notes/test.md' };

    hoisted.mockParseLinktext.mockReturnValue({ path: 'test', subpath: '' });
    hoisted.mockJoin.mockReturnValue('notes/test');
    hoisted.mockGenerateMarkdownLink.mockReturnValue('[[notes/test]]');

    setMetadataCache(plugin, {
      getFirstLinkpathDest: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(createdFile)
        .mockReturnValueOnce(null)
    });

    interface LinkInfo {
      link: string;
      original: string;
    }

    hoisted.mockEditLinks.mockImplementation((_app: unknown, _path: string, callback: (link: LinkInfo) => unknown): void => {
      const result = callback({ link: 'test', original: '[[test]]' });
      expect(result).toBe('[[notes/test]]');

      const result2 = callback({ link: 'other', original: '[[other]]' });
      expect(result2).toBeUndefined();
    });

    await plugin['openLinkText'](next, leaf, 'test', 'source.md');

    expect(hoisted.mockEditLinks).toHaveBeenCalled();
    expect(hoisted.mockGenerateMarkdownLink).toHaveBeenCalledWith({
      app: plugin.app,
      originalLink: '[[test]]',
      sourcePathOrFile: 'source.md',
      targetPathOrFile: createdFile
    });
  });
});
