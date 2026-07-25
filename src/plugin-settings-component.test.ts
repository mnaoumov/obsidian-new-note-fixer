import type { AsyncEventRef } from 'obsidian-dev-utils/async-events';
import type { DataHandler } from 'obsidian-dev-utils/obsidian/data-handler';
import type { PluginEventSource } from 'obsidian-dev-utils/obsidian/plugin/plugin-event-source';

import { noopAsync } from 'obsidian-dev-utils/function';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  describe,
  expect,
  it
} from 'vitest';

import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { NewNoteLocationMode } from './plugin-settings.ts';

class MockDataHandler implements DataHandler {
  private data: unknown;

  public constructor(data: unknown = {}) {
    this.data = data;
  }

  public async loadData(): Promise<unknown> {
    await noopAsync();
    return this.data;
  }

  public async saveData(data: unknown): Promise<void> {
    this.data = data;
    await noopAsync();
  }
}

async function createComponent(data: unknown = {}): Promise<PluginSettingsComponent> {
  const component = new PluginSettingsComponent({
    dataHandler: new MockDataHandler(data),
    pluginEventSource: strictProxy<PluginEventSource>({
      on: (): AsyncEventRef => strictProxy<AsyncEventRef>({})
    })
  });
  await component.loadWithPromises();
  return component;
}

describe('PluginSettingsComponent', () => {
  it('should create default settings', () => {
    const component = new PluginSettingsComponent({
      dataHandler: strictProxy<DataHandler>({}),
      pluginEventSource: strictProxy<PluginEventSource>({})
    });

    expect(component.defaultSettings.newNoteLocationMode).toBe(NewNoteLocationMode.DefaultLocation);
  });

  describe('legacy settings converter', () => {
    it('should map shouldPromptForFolderLocation true into PromptForFolder', async () => {
      const component = await createComponent({ shouldPromptForFolderLocation: true });

      expect(component.settings.newNoteLocationMode).toBe(NewNoteLocationMode.PromptForFolder);
    });

    it('should map shouldPromptForFolderLocation false into DefaultLocation', async () => {
      const component = await createComponent({ shouldPromptForFolderLocation: false });

      expect(component.settings.newNoteLocationMode).toBe(NewNoteLocationMode.DefaultLocation);
    });

    it('should keep DefaultLocation when no legacy setting is present', async () => {
      const component = await createComponent({});

      expect(component.settings.newNoteLocationMode).toBe(NewNoteLocationMode.DefaultLocation);
    });
  });
});
