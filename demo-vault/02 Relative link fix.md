# Relative link fix

A link like `[[../folder/note]]` points *above* the folder of the current note. When the target does not exist, plain Obsidian tries to create a file **outside** the vault root and does not open it; click the link a second time and you get the misleading error `Folder already exists`. `New Note Fixer` stops this: instead of creating a stray file outside the vault, it refuses the out-of-vault path and shows a clear notice.

## Try it

The refusal belongs to the default **Default location** mode, so make sure that mode is on:

```code-button
---
caption: Use the Default location mode
---
await require('/demoSetup.ts').setNoteLocationMode(app, 'Default location');
```

Manual equivalent: set **New note location** to **Default location** in [04 Settings](<./04 Settings.md>). It is the default, so there is nothing to put back afterwards.

<!-- obsidian-dev-toolkit-disable demo-vault-validation/no-wikilinks -- The reader has to click an out-of-vault link that resolves to nothing, which only a wikilink can express here. -->

Then follow the link. This button follows it from this note through the same path a click takes:

```code-button
---
caption: Follow the out-of-vault link
---
await require('/demoSetup.ts').followLinkFromActiveNote(app, '../Outside vault/Stray note');
```

Manual equivalent: click the link in step 1.

1. Click this link, which points above the vault root: [[../Outside vault/Stray note]].
2. Instead of silently creating a broken file outside your vault, `New Note Fixer` shows the notice `Wrong relative path: ../Outside vault/Stray note` and creates nothing.
3. No stray file, and no confusing `Folder already exists` error on a second click.

<!-- obsidian-dev-toolkit-enable demo-vault-validation/no-wikilinks -->

## Inside the vault

A relative link that stays inside the vault is resolved from the folder of the note that holds it, the same way Obsidian resolves it once the target exists. In `Notes/Project/Project.md`:

- `[Note](./Assets/Note.md)` creates `Notes/Project/Assets/Note.md`, creating `Assets` if it does not exist yet.
- `[[../Shared/Note]]` creates `Notes/Shared/Note.md`.

Only a link without `./` or `../` follows your **Default location for new notes** setting.

## Prefer to pick a folder?

If you set **New note location** to **Prompt for folder** or **Ask for current note folder first** (see [04 Settings](<./04 Settings.md>)), a relative link no longer errors out - instead you get a folder picker, pre-filled with the folder the link names, so you can send the new note wherever you like, keeping it inside the vault. **Ask for current note folder first** skips its question for a relative link, which already names a folder relative to the current note. With the default **Default location** mode, the safe default is to refuse the out-of-vault path.

For the everyday folder-qualified case, see [01 Subfolder link fix](<./01 Subfolder link fix.md>).
