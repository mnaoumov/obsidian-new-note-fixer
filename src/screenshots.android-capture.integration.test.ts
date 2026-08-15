/**
 * @file
 *
 * Produces the mobile screenshots the community-store listing needs
 * (T461-P21), driving a staged note in Obsidian Mobile on a real Android
 * emulator and writing images/screenshots/screenshot-mobile-N.png.
 *
 * The mobile counterpart of the desktop capture suite. The evidence is the
 * BREADCRUMB above the note rather than the file explorer, which a phone keeps
 * behind a drawer — it names the folder the note landed in, which is the whole
 * question.
 *
 * There is no mobile equivalent of the desktop viewport override, so the AVD is
 * built at exactly 900x1600 — see [[T461-P21]] for its one-time provisioning.
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

/**
 * App, reduced to the font-size applier that obsidian-typings does not declare.
 * Setting baseFontSize alone changes nothing on screen.
 */
interface FontSizeApp {
  updateFontSize(this: void): void;
}

const PLUGIN_ID = 'new-note-fixer';
const WIDTH_IN_PIXELS = 900;
const HEIGHT_IN_PIXELS = 1600;

/**
 * Base font size for the mobile shots, below the 16px default so the breadcrumb
 * fits one line on a 450dp screen.
 */
const MOBILE_FONT_SIZE_IN_PIXELS = 13;

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
    async callback({ app, fontSizeInPixels, lib: { waitUntil }, newNoteFolder, sourceNotePath }) {
      // A closure runs inside ONE Appium execute/sync call, which WebDriver caps
      // Around 30s, so every wait in here stays comfortably under it.
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 15_000;
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

      app.vault.setConfig('baseFontSize', fontSizeInPixels);
      const fontApp: unknown = app;
      (fontApp as FontSizeApp).updateFontSize();

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { fontSizeInPixels: MOBILE_FONT_SIZE_IN_PIXELS, newNoteFolder: DEFAULT_NEW_NOTE_FOLDER, sourceNotePath: SOURCE_NOTE_PATH },
    vaultPath: vaultPath()
  });
});

describe('mobile store screenshots', () => {
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

      // Let the previous shot's capture settle: the device-metrics override it
      // Sets and clears disturbs anything driven too soon afterwards.
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
 * `images/screenshots/screenshot-mobile-<index>.png`.
 *
 * @param index - The 1-based listing position.
 * @param caption - The caption drawn across the bottom of the frame.
 */
async function shoot(index: number, caption: string): Promise<void> {
  const captured = await captureObsidianScreenshot({ vaultPath: vaultPath() });

  // The AVD is 900x1600, so the device frame IS the store size. Asserting it
  // Here is what keeps that true: run this against any other AVD and it fails
  // Loudly instead of quietly shipping an off-spec image.
  expect(readPngDimensions(captured)).toStrictEqual({
    heightInPixels: HEIGHT_IN_PIXELS,
    widthInPixels: WIDTH_IN_PIXELS
  });

  const labeled = await labelScreenshot(captured, { text: caption });

  mkdirSync(IMAGES_DIRECTORY, { recursive: true });
  writeFileSync(join(IMAGES_DIRECTORY, `screenshot-mobile-${String(index)}.png`), labeled);
}

function vaultPath(): string {
  return getTemporaryVault().path;
}
