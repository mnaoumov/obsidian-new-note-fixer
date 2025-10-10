import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginSettingsTabBase';
import { SettingEx } from 'obsidian-dev-utils/obsidian/SettingEx';

import type { PluginTypes } from './PluginTypes.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginTypes> {
  public override display(): void {
    super.display();

    new SettingEx(this.containerEl)
      .setName('Should prompt for folder location')
      .setDesc('Whether to prompt for the folder location when creating a new note')
      .addToggle((toggle) => {
        this.bind(toggle, 'shouldPromptForFolderLocation');
      });
  }
}
