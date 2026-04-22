import {
  describe,
  expect,
  it
} from 'vitest';

import { PluginSettings } from './plugin-settings.ts';

describe('PluginSettings', () => {
  it('should have shouldPromptForFolderLocation default to false', () => {
    const settings = new PluginSettings();

    expect(settings.shouldPromptForFolderLocation).toBe(false);
  });
});
