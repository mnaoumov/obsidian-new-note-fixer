import { getTempVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  describe,
  expect,
  it
} from 'vitest';

import { registerNewNoteLocationSuite } from './new-note-location-shared.integration.test.ts';

describe('Smoke test', () => {
  it('should load plugin on Android', () => {
    const vault = getTempVault();
    expect(vault.path).toBeTruthy();
  });
});

registerNewNoteLocationSuite('Android');
