import type { SettingDefinitionItem } from 'obsidian';

import { appendCodeBlock } from '@mnaoumov/obsidian-lib/html-element';
import { PluginSettingsTabBase } from '@mnaoumov/obsidian-lib/plugin/plugin-settings-tab';

import type { PluginSettings } from './plugin-settings.ts';

import { NewNoteLocationMode } from './plugin-settings.ts';

const MAX_RECENT_FOLDER_COUNT = 20;

export class PluginSettingsTab extends PluginSettingsTabBase<PluginSettings> {
  protected override getSettingDefinitionItems(): SettingDefinitionItem[] {
    return [
      this.settingEx({
        desc: createFragment((f) => {
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
        }),
        name: 'New note location',
        render: (setting) => {
          setting.addDropdown((dropdown) => {
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
      }),
      this.settingEx({
        desc: createFragment((f) => {
          f.appendText('How many folders holding the most recently created notes to show at the top of the folder picker.');
          f.createEl('br');
          f.appendText('Set to ');
          appendCodeBlock(f, '0');
          f.appendText(' to turn it off.');
        }),
        name: 'Number of recent folders',
        render: (setting) => {
          setting.addSlider((slider) => {
            slider.setLimits(0, MAX_RECENT_FOLDER_COUNT, 1);
            this.bind({
              propertyName: 'recentFolderCount',
              valueComponent: slider
            });
          });
        }
      })
    ];
  }
}
