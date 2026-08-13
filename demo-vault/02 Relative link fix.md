# Relative link fix

A link like `[[../folder/note]]` points *above* the folder of the current note. When the target does not exist, plain Obsidian tries to create a file **outside** the vault root and does not open it; click the link a second time and you get the misleading error `Folder already exists`. New Note Fixer stops this: instead of creating a stray file outside the vault, it refuses the out-of-vault path and shows a clear notice.

## Try it

<!-- obsidian-dev-utils-disable demo-vault-validation/no-wikilinks -- The reader has to click an out-of-vault link that resolves to nothing, which only a wikilink can express here. -->

1. Click this link, which points above the vault root: [[../Outside vault/Stray note]].
2. Instead of silently creating a broken file outside your vault, New Note Fixer shows the notice `Wrong relative path: ../Outside vault/Stray note` and creates nothing.
3. No stray file, and no confusing `Folder already exists` error on a second click.

<!-- obsidian-dev-utils-enable demo-vault-validation/no-wikilinks -->

## Prefer to pick a folder?

If you set **New note location** to **Prompt for folder** or **Ask for current note folder first** (see [04 Settings](<./04 Settings.md>)), a relative link no longer errors out - instead you get a folder picker so you can send the new note wherever you like, keeping it inside the vault. With the default **Default location** mode, the safe default is to refuse the out-of-vault path.

For the everyday folder-qualified case, see [01 Subfolder link fix](<./01 Subfolder link fix.md>).
