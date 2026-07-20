import type {
  App as AppType,
  PluginManifest
} from 'obsidian';

import {
  App,
  WorkspaceLeaf
} from 'obsidian';
import { castTo } from 'obsidian-dev-utils/object-utils';
import { PluginSettingsTabComponent } from 'obsidian-dev-utils/obsidian/components/plugin-settings-tab-component';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { WorkspaceLeafOpenLinkTextPatchComponent } from './patches/workspace-leaf-open-link-text-patch-component.ts';
import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { Plugin } from './plugin.ts';

/**
 * The slim `Plugin` is driven through the REAL `PluginBase` lifecycle (never
 * mocked): `await plugin.onload()` runs the real `onloadImpl`, constructs the
 * real child components and loads them children-first. The test asserts that the
 * three plugin-specific children are wired, reusing `App.createConfigured__()`
 * from `obsidian-test-mocks` so the real load path has a fully-wired app.
 */

interface AppOriginal {
  asOriginalType__(): AppType;
}

interface AppStatics {
  createConfigured__(): AppOriginal;
}

interface PatchedProto {
  openLinkText?: WorkspaceLeaf['openLinkText'];
}

describe('Plugin', () => {
  afterEach(() => {
    // The patch component installs onto `WorkspaceLeaf.prototype` during load; unload restores it.
    delete castTo<PatchedProto>(WorkspaceLeaf.prototype).openLinkText;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should wire the settings, settings-tab and openLinkText-patch children in onloadImpl', async () => {
    const app = castTo<AppStatics>(App).createConfigured__().asOriginalType__();
    const plugin = new Plugin(app, strictProxy<PluginManifest>({ id: 'test', name: 'test', version: '1.0.0' }));
    const addChildSpy = vi.spyOn(plugin, 'addChild');

    await plugin.onload();

    const addedChildren = addChildSpy.mock.calls.map((call) => call[0]);
    expect(addedChildren.some((child) => child instanceof PluginSettingsComponent)).toBe(true);
    expect(addedChildren.some((child) => child instanceof PluginSettingsTabComponent)).toBe(true);
    expect(addedChildren.some((child) => child instanceof WorkspaceLeafOpenLinkTextPatchComponent)).toBe(true);

    plugin.unload();
  });

  it('should register the open demo vault command via its command handler', async () => {
    const app = castTo<AppStatics>(App).createConfigured__().asOriginalType__();
    const plugin = new Plugin(app, strictProxy<PluginManifest>({ id: 'test', name: 'test', version: '1.0.0' }));
    const addCommandSpy = vi.spyOn(plugin, 'addCommand');

    await plugin.onload();

    expect(addCommandSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'open-demo-vault' })
    );

    plugin.unload();
  });
});
