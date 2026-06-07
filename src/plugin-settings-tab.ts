import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/plugin/plugin-settings-tab';
import { SettingEx } from 'obsidian-dev-utils/obsidian/setting-ex';

import type { PluginSettings } from './plugin-settings.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginSettings> {
  public override display(): void {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- super.display() calls the PluginSettingsTabBase override; the inherited @deprecated tag on Obsidian's SettingTab.display propagates via TS getJsDocTags.
    super.display();

    new SettingEx(this.containerEl)
      .setName('Should prompt for folder location')
      .setDesc('Whether to prompt for the folder location when creating a new note')
      .addToggle((toggle) => {
        this.bind(toggle, 'shouldPromptForFolderLocation');
      });
  }
}
