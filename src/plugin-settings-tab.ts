import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/plugin/plugin-settings-tab';
import { SettingEx } from 'obsidian-dev-utils/obsidian/setting-ex';

import type { PluginSettings } from './plugin-settings.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginSettings> {
  public override displayLegacy(): void {
    super.displayLegacy();

    new SettingEx(this.containerEl)
      .setName('Should prompt for folder location')
      .setDesc('Whether to prompt for the folder location when creating a new note')
      .addToggle((toggle) => {
        this.bind(toggle, 'shouldPromptForFolderLocation');
      });
  }
}
