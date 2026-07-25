import { appendCodeBlock } from 'obsidian-dev-utils/obsidian/html-element';
import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/plugin/plugin-settings-tab';
import { SettingEx } from 'obsidian-dev-utils/obsidian/setting-ex';

import type { PluginSettings } from './plugin-settings.ts';

import { NewNoteLocationMode } from './plugin-settings.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginSettings> {
  public override displayLegacy(): void {
    super.displayLegacy();

    new SettingEx(this.containerEl)
      .setName('New note location')
      .setDesc(createFragment((f) => {
        f.appendText('Where to create a new note when following a link to a non-existing note.');
        f.createEl('br');
        appendCodeBlock(f, 'Default location');
        f.appendText(' - use Obsidian’s configured "Default location for new notes".');
        f.createEl('br');
        appendCodeBlock(f, 'Prompt for folder');
        f.appendText(' - always ask for the folder via a fuzzy folder picker.');
        f.createEl('br');
        appendCodeBlock(f, 'Ask for current note folder first');
        f.appendText(' - open the folder picker pre-filled with the current note’s folder (confirm), so you can accept or adjust it.');
      }))
      .addDropdown((dropdown) => {
        dropdown.addOptions({
          /* eslint-disable perfectionist/sort-objects -- Need to keep order. */
          [NewNoteLocationMode.DefaultLocation]: 'Default location',
          [NewNoteLocationMode.PromptForFolder]: 'Prompt for folder',
          [NewNoteLocationMode.AskForCurrentNoteFolderFirst]: 'Ask for current note folder first'
          /* eslint-enable perfectionist/sort-objects -- Need to keep order. */
        });
        this.bind({
          propertyName: 'newNoteLocationMode',
          valueComponent: dropdown
        });
      });
  }
}
