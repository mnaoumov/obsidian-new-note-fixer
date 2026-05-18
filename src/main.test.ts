import {
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/components/plugin-settings-tab-component', () => ({
  PluginSettingsTabComponent: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/components/plugin-settings-component', () => ({
  PluginSettingsComponentBase: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin-settings-tab', () => ({
  PluginSettingsTabBase: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/setting-ex', () => ({
  SettingEx: vi.fn()
}));

vi.mock('obsidian', () => ({
  FuzzySuggestModal: vi.fn(),
  Notice: vi.fn(),
  WorkspaceLeaf: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/link', () => ({
  editLinks: vi.fn(),
  generateMarkdownLink: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/monkey-around', () => ({
  registerPatch: vi.fn()
}));

vi.mock('obsidian-dev-utils/path', () => ({
  basename: vi.fn(),
  dirname: vi.fn(),
  join: vi.fn()
}));

vi.mock('obsidian-dev-utils/async', () => ({
  invokeAsyncSafely: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import Plugin from './main.ts';
// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin as PluginClass } from './plugin.ts';

describe('main', () => {
  it('should export Plugin as default export', () => {
    expect(Plugin).toBe(PluginClass);
  });
});
