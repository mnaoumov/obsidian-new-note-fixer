# Subfolder link fix

When you click a link to a non-existing note, Obsidian creates the note for you. A bare `[[link]]` respects **Settings -> Files and links -> Default location for new notes**, but a **folder-qualified** link like `[[folder/note]]` ignores that setting and always creates the note at `<vault root>/folder/note.md`. New Note Fixer makes the folder-qualified case respect the same **Default location for new notes** setting, so note creation is consistent no matter how you wrote the link.

## Try it

<!-- obsidian-dev-utils-disable demo-vault-validation/no-wikilinks -- Clicking a link to a note that does not exist yet IS the feature, and a Markdown link to a missing note fails lint:md. -->

First, point Obsidian's default location somewhere obvious, so the difference is visible:

```code-button
---
caption: Default new notes to an Inbox folder
---
await require('/demoSetup.ts').useInboxAsDefaultLocation(app);
```

Manual equivalent: create a folder named `Inbox`, then set **Settings -> Files and links -> Default location for new notes** to **In the folder specified below** and choose it. The folder must already exist - Obsidian silently falls back to the vault root otherwise, which looks just like the bug this plugin fixes.

Then:

1. Come back to this note and click this link to a note that does not exist yet: [[Projects/Fresh idea]].
2. New Note Fixer creates and opens the note under your default location - `Inbox/Projects/Fresh idea.md` - instead of the vault-root `Projects/Fresh idea.md` that plain Obsidian would make.
3. The link in this note is rewritten to point at the note that was actually created, so it keeps working.

<!-- obsidian-dev-utils-enable demo-vault-validation/no-wikilinks -->

When you have seen it, put Obsidian's setting back:

```code-button
---
caption: Restore the default location to the vault root
---
require('/demoSetup.ts').restoreDefaultLocation(app);
```

Manual equivalent: set **Default location for new notes** back to **Vault folder**.

## What it does

- **Folder-qualified links**
  - `[[folder/note]]` is routed through **Default location for new notes** (via `getNewFileParent`), the same rule a bare `[[note]]` already follows.
- **The clicked link is repaired**
  - after the note is created in its unified location, the source link is updated to resolve to it, so you never end up with a dangling link.
- **Prompt instead of auto-place**
  - if you would rather choose the destination folder yourself each time, set **New note location** to **Prompt for folder** in [04 Settings](<./04 Settings.md>). To be asked whether to use the current note's folder, see [03 Current note folder](<./03 Current note folder.md>).

Relative links that try to climb above the source folder (`[[../folder/note]]`) are handled separately - see [02 Relative link fix](<./02 Relative link fix.md>).
