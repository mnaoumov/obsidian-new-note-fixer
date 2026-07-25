import type { DataHandler } from 'obsidian-dev-utils/obsidian/data-handler';
import type { PluginEventSource } from 'obsidian-dev-utils/obsidian/plugin/plugin-event-source';

import { PluginSettingsComponentBase } from 'obsidian-dev-utils/obsidian/components/plugin-settings-component';

import {
  NewNoteLocationMode,
  PluginSettings
} from './plugin-settings.ts';

interface PluginSettingsComponentConstructorParams {
  readonly dataHandler: DataHandler;
  readonly pluginEventSource: PluginEventSource;
}

class LegacySettings {
  public shouldPromptForFolderLocation = false;
}

export class PluginSettingsComponent extends PluginSettingsComponentBase<PluginSettings> {
  public constructor(params: PluginSettingsComponentConstructorParams) {
    super({
      ...params,
      pluginSettingsClass: PluginSettings
    });
  }

  protected override registerLegacySettingsConverters(): void {
    this.registerLegacySettingsConverter(LegacySettings, (legacySettings) => {
      if (legacySettings.shouldPromptForFolderLocation !== undefined && legacySettings.newNoteLocationMode === undefined) {
        legacySettings.newNoteLocationMode = legacySettings.shouldPromptForFolderLocation
          ? NewNoteLocationMode.PromptForFolder
          : NewNoteLocationMode.DefaultLocation;
      }
    });
  }
}
