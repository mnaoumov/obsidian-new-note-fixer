import {
  describe,
  expect,
  it
} from 'vitest';

import {
  NewNoteLocationMode,
  PluginSettings
} from './plugin-settings.ts';

describe('PluginSettings', () => {
  it('should have newNoteLocationMode default to DefaultLocation', () => {
    const settings = new PluginSettings();

    expect(settings.newNoteLocationMode).toBe(NewNoteLocationMode.DefaultLocation);
  });

  it('should show 5 recent folders by default', () => {
    const settings = new PluginSettings();

    expect(settings.recentFolderCount).toBe(5);
  });
});
