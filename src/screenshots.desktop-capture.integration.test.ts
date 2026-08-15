/**
 * @file
 *
 * Produces the desktop screenshots the community-store listing needs
 * (T461-P21), driving a staged note in a real Obsidian and writing
 * `images/screenshots/screenshot-desktop-N.png`.
 *
 * TWO shots, and the subject is a PATH: where a new note lands when you click a
 * link to one that does not exist yet. That is invisible in the note itself, so
 * both frames are of the FILE EXPLORER, which is where a note appearing in the
 * wrong place is something you can see.
 *
 * Each shot asserts the path the note actually got, so the frames cannot
 * disagree with their captions.
 */

import {
  mkdirSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  captureObsidianScreenshot,
  evalInObsidian,
  labelScreenshot,
  readPngDimensions
} from 'obsidian-integration-testing';
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  beforeAll,
  describe,
  expect,
  it
} from 'vitest';

const PLUGIN_ID = 'new-note-fixer';
const WIDTH_IN_PIXELS = 1200;
const HEIGHT_IN_PIXELS = 800;

/**
 * The note the links are clicked from. It lives in a folder of its own, so
 * "beside the source note" and "at the vault root" are visibly different places.
 */
const SOURCE_NOTE_PATH = 'Projects/Alpha/Kickoff.md';

/**
 * Where the vault is told to put new notes. The whole question is whether that
 * setting is honored.
 */
const DEFAULT_NEW_NOTE_FOLDER = 'Inbox';

const UNFIXED_LINK = 'meetings/first review';
const FIXED_LINK = 'meetings/second review';

const IMAGES_DIRECTORY = join(process.cwd(), 'images', 'screenshots');

beforeAll(async () => {
  const vault = getTemporaryVault();

  vault.populate({
    'Inbox/.gitkeep.md': '# Inbox\n\nWhere this vault is told to put new notes.\n',
    [SOURCE_NOTE_PATH]: buildSourceNote()
  });
  await vault.syncToDevice();

  await evalInObsidian({
    async callback({ app, lib: { waitUntil }, newNoteFolder, sourceNotePath }) {
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 30_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1000;

      app.changeTheme('obsidian');

      await waitUntil({
        message: 'the staged notes to appear in the vault',
        predicate: () => Boolean(app.vault.getFileByPath(sourceNotePath)),
        timeoutInMilliseconds: SETTLE_TIMEOUT_IN_MILLISECONDS
      });

      // The setting the whole plugin is about: put new notes in this folder.
      app.vault.setConfig('newFileLocation', 'folder');
      app.vault.setConfig('newFileFolderPath', newNoteFolder);

      // The file explorer IS the subject here, so it stays open.
      app.workspace.leftSplit.expand();
      const fileExplorerLeaf = app.workspace.getLeavesOfType('file-explorer')[0];
      if (fileExplorerLeaf) {
        await app.workspace.revealLeaf(fileExplorerLeaf);
      }

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { newNoteFolder: DEFAULT_NEW_NOTE_FOLDER, sourceNotePath: SOURCE_NOTE_PATH },
    vaultPath: vaultPath()
  });
});

describe('desktop store screenshots', () => {
  it('1 - where the note lands without the plugin', async () => {
    // A before-shot is only safe BECAUSE of the caption. A listing carousel
    // Shows screenshots one at a time, so an unlabelled one reads as a picture
    // Of what the plugin does, not of what it fixes.
    await setPluginEnabled(false);
    const createdPath = await clickUnresolvedLink(UNFIXED_LINK);
    // At the vault ROOT, ignoring the folder the vault was told to use.
    expect(createdPath).toBe(`${UNFIXED_LINK}.md`);
    await shoot(1, 'Without the plugin: a new note lands at the vault root');
    await setPluginEnabled(true);
  });

  it('2 - where it lands with the plugin', async () => {
    const createdPath = await clickUnresolvedLink(FIXED_LINK);
    expect(createdPath).toBe(`${DEFAULT_NEW_NOTE_FOLDER}/${FIXED_LINK}.md`);
    await shoot(2, 'With it: your default location for new notes is honored');
  });
});

/**
 * Builds the note the links are clicked from.
 *
 * @returns The note's Markdown.
 */
function buildSourceNote(): string {
  return '# Kickoff\n\n'
    + 'Notes to write up later:\n\n'
    + `- [[${UNFIXED_LINK}]]\n`
    + `- [[${FIXED_LINK}]]\n`;
}

/**
 * Opens an unresolved link from the staged note, which is what makes Obsidian
 * create the note, and reports where it put it.
 *
 * @param linkText - The link to follow.
 * @returns The path of the note that got created.
 */
async function clickUnresolvedLink(linkText: string): Promise<string> {
  return await evalInObsidian({
    async callback({ app, lib: { waitUntil }, linkText: link, sourceNotePath }) {
      const CREATE_TIMEOUT_IN_MILLISECONDS = 20_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1500;
      const RESIZE_SETTLE_DELAY_IN_MILLISECONDS = 2000;

      // Let the previous shot's capture settle: the device-metrics override it
      // Sets and clears disturbs anything driven too soon afterwards.
      await sleep(RESIZE_SETTLE_DELAY_IN_MILLISECONDS);

      const sourceFile = app.vault.getFileByPath(sourceNotePath);
      if (!sourceFile) {
        throw new Error(`Note is missing from the vault: ${sourceNotePath}`);
      }

      const leaf = app.workspace.getLeaf(false);
      await leaf.openFile(sourceFile);

      // The plugin patches `WorkspaceLeaf.openLinkText`, which is exactly what
      // Clicking an unresolved link calls — so this drives the real path rather
      // Than a simulation of it.
      await leaf.openLinkText(link, sourceNotePath);

      await waitUntil({
        message: 'the note to be created somewhere in the vault',
        predicate: () => app.vault.getMarkdownFiles().some((file) => file.basename === link.split('/').at(-1)),
        timeoutInMilliseconds: CREATE_TIMEOUT_IN_MILLISECONDS
      });

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      const created = app.vault.getMarkdownFiles().find((file) => file.basename === link.split('/').at(-1));
      return created?.path ?? '(not created)';
    },
    input: { linkText, sourceNotePath: SOURCE_NOTE_PATH },
    vaultPath: vaultPath()
  });
}

/**
 * Enables or disables the plugin, for the one shot that shows the state its
 * absence leaves behind.
 *
 * @param isEnabled - Whether the plugin should be on.
 */
async function setPluginEnabled(isEnabled: boolean): Promise<void> {
  await evalInObsidian({
    async callback({ app, isEnabled: shouldEnable, pluginId }) {
      const SETTLE_DELAY_IN_MILLISECONDS = 1500;

      if (shouldEnable) {
        await app.plugins.enablePlugin(pluginId);
      } else {
        await app.plugins.disablePlugin(pluginId);
      }

      app.workspace.trigger('layout-change');

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { isEnabled, pluginId: PLUGIN_ID },
    vaultPath: vaultPath()
  });
}

/**
 * Captures the window, captions it, and writes it as
 * `images/screenshots/screenshot-desktop-<index>.png`.
 *
 * @param index - The 1-based listing position.
 * @param caption - The caption drawn across the bottom of the frame.
 */
async function shoot(index: number, caption: string): Promise<void> {
  const bytes = await captureObsidianScreenshot({
    heightInPixels: HEIGHT_IN_PIXELS,
    vaultPath: vaultPath(),
    widthInPixels: WIDTH_IN_PIXELS
  });

  const labeled = await labelScreenshot(bytes, { text: caption });

  expect(readPngDimensions(labeled)).toStrictEqual({
    heightInPixels: HEIGHT_IN_PIXELS,
    widthInPixels: WIDTH_IN_PIXELS
  });

  mkdirSync(IMAGES_DIRECTORY, { recursive: true });
  writeFileSync(join(IMAGES_DIRECTORY, `screenshot-desktop-${String(index)}.png`), labeled);
}

function vaultPath(): string {
  return getTemporaryVault().path;
}
