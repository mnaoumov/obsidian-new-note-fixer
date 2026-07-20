[Docs](https://github.com/mnaoumov/obsidian-new-note-fixer/)

# Subfolder link fix

When you click a link to a non-existing note, Obsidian creates the note for you. A bare `[[link]]` respects **Settings -> Files and links -> Default location for new notes**, but a **folder-qualified** link like `[[folder/note]]` ignores that setting and always creates the note at `<vault root>/folder/note.md`. New Note Fixer makes the folder-qualified case respect the same **Default location for new notes** setting, so note creation is consistent no matter how you wrote the link.

## Try it

1. Open **Settings -> Files and links** and set **Default location for new notes** to **In the folder specified below**, then pick (or type) `Inbox`. This makes the difference easy to see.
2. Come back to this note and click this link to a note that does not exist yet: [[Projects/Fresh idea]].
3. New Note Fixer creates and opens the note under your default location - `Inbox/Projects/Fresh idea.md` - instead of the vault-root `Projects/Fresh idea.md` that plain Obsidian would make.
4. The link in this note is rewritten to point at the note that was actually created, so it keeps working.

## What it does

- **Folder-qualified links** - `[[folder/note]]` is routed through **Default location for new notes** (via `getNewFileParent`), the same rule a bare `[[note]]` already follows.
- **The clicked link is repaired** - after the note is created in its unified location, the source link is updated to resolve to it, so you never end up with a dangling link.
- **Prompt instead of auto-place** - if you would rather choose the destination folder yourself each time, turn on the prompt option in [[03 Settings]].

Relative links that try to climb above the source folder (`[[../folder/note]]`) are handled separately - see [[02 Relative link fix]].
