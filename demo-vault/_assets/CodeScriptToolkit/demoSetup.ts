import type { App } from 'obsidian';

import { Notice } from 'obsidian';
import { configureCommunityPlugin } from 'obsidian-dev-utils/obsidian/community-plugins';

const PLUGIN_ID = 'new-note-fixer';
const DEMO_DEFAULT_FOLDER_PATH = 'Inbox';

/**
 * Points Obsidian's own **Default location for new notes** at an `Inbox` folder, creating the folder
 * first.
 *
 * The folder has to exist: `getMarkdownNewFileParent` reads `newFileFolderPath`, and if it does not
 * resolve to a real folder Obsidian silently falls back to the vault root — which looks exactly like
 * the bug this plugin fixes, so the demo would appear to fail for the wrong reason.
 *
 * Manual equivalent: create a folder named `Inbox`, then set **Settings -> Files and links -> Default
 * location for new notes** to **In the folder specified below** and choose it.
 */
export async function useInboxAsDefaultLocation(app: App): Promise<void> {
  if (!app.vault.getFolderByPath(DEMO_DEFAULT_FOLDER_PATH)) {
    await app.vault.createFolder(DEMO_DEFAULT_FOLDER_PATH);
  }
  app.vault.setConfig('newFileFolderPath', DEMO_DEFAULT_FOLDER_PATH);
  app.vault.setConfig('newFileLocation', 'folder');
  new Notice(`New notes now default to ${DEMO_DEFAULT_FOLDER_PATH}/. Click the link below.`);
}

/**
 * Puts **Default location for new notes** back to the vault root.
 *
 * Manual equivalent: set **Settings -> Files and links -> Default location for new notes** back to
 * **Vault folder**.
 */
export function restoreDefaultLocation(app: App): void {
  app.vault.setConfig('newFileLocation', 'root');
  app.vault.setConfig('newFileFolderPath', '/');
  new Notice('New notes default to the vault root again.');
}

/**
 * Switches the plugin's placement mode.
 *
 * Applied live through the plugin's own settings component, so there is no reload.
 *
 * Manual equivalent: change **New note location** in **Settings -> Community plugins -> New Note
 * Fixer**.
 */
export async function setNoteLocationMode(app: App, newNoteLocationMode: string): Promise<void> {
  await configureCommunityPlugin({ app, pluginId: PLUGIN_ID, settings: { newNoteLocationMode } });
  new Notice(`New note location: ${newNoteLocationMode}`);
}
