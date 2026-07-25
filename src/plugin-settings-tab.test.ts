import type { Plugin } from 'obsidian';
import type { DataHandler } from 'obsidian-dev-utils/obsidian/data-handler';
import type { PluginEventSource } from 'obsidian-dev-utils/obsidian/plugin/plugin-event-source';

import {
  App,
  DropdownComponent,
  Setting
} from 'obsidian';
import { castTo } from 'obsidian-dev-utils/object-utils';
import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/plugin/plugin-settings-tab';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { PluginSettingsTab } from './plugin-settings-tab.ts';
import { NewNoteLocationMode } from './plugin-settings.ts';

interface AppStatics {
  createConfigured__(): App;
}

function createTab(): PluginSettingsTab {
  const app = castTo<AppStatics>(App).createConfigured__();
  const plugin = strictProxy<Plugin>({ app });
  const pluginSettingsComponent = new PluginSettingsComponent({
    dataHandler: strictProxy<DataHandler>({}),
    pluginEventSource: strictProxy<PluginEventSource>({})
  });
  return new PluginSettingsTab({ plugin, pluginSettingsComponent });
}

describe('PluginSettingsTab', () => {
  beforeEach(() => {
    /*
     * The real `bind` duck-types the value component via a strict-proxy probe (`setPlaceholderValue`),
     * which throws on the non-text toggle. `bind` is exercised by dev-utils' own tests, so stubbing its
     * return value (a passthrough) is an allowed double, not a re-implementation.
     */
    vi.spyOn(PluginSettingsTabBase.prototype, 'bind').mockImplementation((params) => params.valueComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render a single dropdown setting with the expected name and options', () => {
    const setNameSpy = vi.spyOn(Setting.prototype, 'setName');
    const addDropdownSpy = vi.spyOn(Setting.prototype, 'addDropdown');
    const addOptionsSpy = vi.spyOn(DropdownComponent.prototype, 'addOptions');

    const tab = createTab();
    tab.displayLegacy();

    expect(setNameSpy).toHaveBeenCalledWith('New note location');
    expect(addDropdownSpy).toHaveBeenCalledOnce();
    expect(addOptionsSpy).toHaveBeenCalledWith({
      [NewNoteLocationMode.AskForCurrentNoteFolderFirst]: 'Ask for current note folder first',
      [NewNoteLocationMode.DefaultLocation]: 'Default location',
      [NewNoteLocationMode.PromptForFolder]: 'Prompt for folder'
    });
  });

  it('should bind the dropdown to newNoteLocationMode', () => {
    const tab = createTab();
    tab.displayLegacy();

    const boundKeys = vi.mocked(PluginSettingsTabBase.prototype.bind).mock.calls.map((call) => call[0].propertyName);
    expect(boundKeys).toContain('newNoteLocationMode');
  });
});
