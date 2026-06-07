import type { Plugin } from 'obsidian';

import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  describe,
  expect,
  it,
  vi
} from 'vitest';

import type { PluginSettingsComponent } from './plugin-settings-component.ts';

interface MockSettingInstance {
  addToggle: ReturnType<typeof vi.fn>;
  setDesc(desc: string): MockSettingInstance;
  setName(name: string): MockSettingInstance;
}

const settingInstances: MockSettingInstance[] = [];

const hoisted = vi.hoisted(() => {
  const keys: string[] = [];

  class PluginSettingsTabBaseMock {
    public containerEl = {};

    public bind(_component: unknown, key: string): void {
      keys.push(key);
    }

    public display(): void {
      /* Base implementation */
    }
  }

  return { keys, PluginSettingsTabBaseMock };
});

vi.mock('obsidian-dev-utils/obsidian/setting-ex', () => ({
  SettingEx: class MockSettingEx {
    public addToggle = vi.fn().mockImplementation(function addToggleMock(this: MockSettingInstance, cb: (toggle: unknown) => void) {
      cb({ mockToggle: true });
      return this;
    });

    public setDesc = vi.fn().mockReturnThis();
    public setName = vi.fn().mockReturnThis();

    public constructor() {
      settingInstances.push(this);
    }
  }
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin-settings-tab', () => ({
  PluginSettingsTabBase: hoisted.PluginSettingsTabBaseMock
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { PluginSettingsTab } from './plugin-settings-tab.ts';

describe('PluginSettingsTab', () => {
  it('should create one toggle setting on display', () => {
    settingInstances.length = 0;

    const tab = new PluginSettingsTab({ plugin: strictProxy<Plugin>({}), pluginSettingsComponent: strictProxy<PluginSettingsComponent>({}) });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- display() is the entry point for PluginSettingsTabBase; calling it in tests is intentional.
    tab.display();

    expect(settingInstances).toHaveLength(1);
  });

  it('should set correct name for the setting', () => {
    settingInstances.length = 0;

    const tab = new PluginSettingsTab({ plugin: strictProxy<Plugin>({}), pluginSettingsComponent: strictProxy<PluginSettingsComponent>({}) });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- display() is the entry point for PluginSettingsTabBase; calling it in tests is intentional.
    tab.display();

    expect(settingInstances.at(0)?.setName).toHaveBeenCalledWith('Should prompt for folder location');
  });

  it('should set correct description for the setting', () => {
    settingInstances.length = 0;

    const tab = new PluginSettingsTab({ plugin: strictProxy<Plugin>({}), pluginSettingsComponent: strictProxy<PluginSettingsComponent>({}) });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- display() is the entry point for PluginSettingsTabBase; calling it in tests is intentional.
    tab.display();

    expect(settingInstances.at(0)?.setDesc).toHaveBeenCalledWith('Whether to prompt for the folder location when creating a new note');
  });

  it('should bind shouldPromptForFolderLocation via addToggle callback', () => {
    settingInstances.length = 0;
    hoisted.keys.length = 0;

    const tab = new PluginSettingsTab({ plugin: strictProxy<Plugin>({}), pluginSettingsComponent: strictProxy<PluginSettingsComponent>({}) });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- display() is the entry point for PluginSettingsTabBase; calling it in tests is intentional.
    tab.display();

    expect(hoisted.keys).toContain('shouldPromptForFolderLocation');
  });
});
