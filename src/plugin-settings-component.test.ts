import type { DataHandler } from 'obsidian-dev-utils/obsidian/data-handler';
import type { PluginEventSource } from 'obsidian-dev-utils/obsidian/plugin/plugin-event-source';

import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  describe,
  expect,
  it,
  vi
} from 'vitest';

interface MockConstructorParams {
  readonly pluginSettingsClass: new () => unknown;
}

const PluginSettingsComponentBaseMock = vi.hoisted(() =>
  class {
    public readonly defaultSettings: unknown;

    public constructor(params: MockConstructorParams) {
      this.defaultSettings = new params.pluginSettingsClass();
    }
  }
);

vi.mock('obsidian-dev-utils/obsidian/components/plugin-settings-component', () => ({
  PluginSettingsComponentBase: PluginSettingsComponentBaseMock
}));

vi.mock('./plugin-settings.ts', () => ({
  PluginSettings: class MockPluginSettings {
    public shouldPromptForFolderLocation = false;
  }
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { PluginSettingsComponent } from './plugin-settings-component.ts';

describe('PluginSettingsComponent', () => {
  it('should create default settings', () => {
    const component = new PluginSettingsComponent({
      dataHandler: strictProxy<DataHandler>({}),
      pluginEventSource: strictProxy<PluginEventSource>({})
    });
    const settings = component.defaultSettings;

    expect(settings).toBeDefined();
    expect(settings.shouldPromptForFolderLocation).toBe(false);
  });
});
