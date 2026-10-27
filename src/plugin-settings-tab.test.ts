import type { DataHandler } from '@mnaoumov/obsidian-lib/data-handler';
import type { PluginEventSource } from '@mnaoumov/obsidian-lib/plugin/plugin-event-source';
import type {
  Plugin,
  SettingGroup
} from 'obsidian';

import { PluginSettingsTabBase } from '@mnaoumov/obsidian-lib/plugin/plugin-settings-tab';
import { SettingEx } from '@mnaoumov/obsidian-lib/setting-ex';
import { castTo } from '@mnaoumov/typescript-lib/object-utils';
import { strictProxy } from '@mnaoumov/typescript-test-toolkit/strict-proxy';
import {
  App,
  DropdownComponent,
  Setting
} from 'obsidian';
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
  readonly createConfigured__: () => App;
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

/**
 * Invokes every row's `render` callback the way Obsidian does when the tab is opened, so the bindings are
 * still exercised now that the rows are declarative.
 *
 * @param tab - The settings tab.
 * @returns The names of the declared rows.
 */
function renderSettings(tab: PluginSettingsTab): string[] {
  const names: string[] = [];
  for (const definition of tab.getSettingDefinitions()) {
    if ('name' in definition) {
      names.push(definition.name);
    }

    if ('render' in definition) {
      definition.render(new SettingEx(tab.containerEl), castTo<SettingGroup>(null));
    }
  }

  return names;
}

describe('PluginSettingsTab', () => {
  beforeEach(() => {
    /*
     * The real `bind` duck-types the value component via a strict-proxy probe (`setPlaceholderValue`),
     * which throws on the non-text toggle. `bind` is exercised by obsidian-lib's own tests, so stubbing its
     * return value (a passthrough) is an allowed double, not a re-implementation.
     */
    vi.spyOn(PluginSettingsTabBase.prototype, 'bind').mockImplementation((params) => params.valueComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render a single dropdown setting with the expected name and options', () => {
    const addDropdownSpy = vi.spyOn(Setting.prototype, 'addDropdown');
    const addOptionsSpy = vi.spyOn(DropdownComponent.prototype, 'addOptions');

    const tab = createTab();
    const names = renderSettings(tab);

    expect(names).toStrictEqual(['New note location']);
    expect(addDropdownSpy).toHaveBeenCalledOnce();
    expect(addOptionsSpy).toHaveBeenCalledWith({
      [NewNoteLocationMode.AskForCurrentNoteFolderFirst]: 'Ask for current note folder first',
      [NewNoteLocationMode.DefaultLocation]: 'Default location',
      [NewNoteLocationMode.PromptForFolder]: 'Prompt for folder'
    });
  });

  it('should bind the dropdown to newNoteLocationMode', () => {
    const tab = createTab();
    renderSettings(tab);

    const boundKeys = vi.mocked(PluginSettingsTabBase.prototype.bind).mock.calls.map((call) => call[0].propertyName);
    expect(boundKeys).toContain('newNoteLocationMode');
  });
});
