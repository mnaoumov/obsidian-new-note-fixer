import type { App } from 'obsidian';

import { Notice } from 'obsidian';
import {
  enableCommunityPlugin,
  installCommunityPlugin
} from 'obsidian-dev-utils/obsidian/community-plugins';

// New Note Fixer works by patching how Obsidian creates a non-existing note when you click its
// Link, so there is nothing for a code-button to drive - the demo notes walk through it by having
// You click links. The only helper the vault needs is the shared CodeScript Toolkit installer used
// By the prerequisite note's button.
export async function installAndEnable(app: App, pluginId: string): Promise<void> {
  await installCommunityPlugin({ app, pluginId });
  await enableCommunityPlugin({ app, pluginId });
  new Notice(`Installed and enabled: ${pluginId}`);
}
