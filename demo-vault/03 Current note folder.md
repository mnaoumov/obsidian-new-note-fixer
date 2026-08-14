# Current note folder

By default New Note Fixer places a new note under your **Default location for new notes** setting. Often, though, you want the new note to live right next to the note you are writing in. The **Ask for current note folder first** mode makes that a one-click choice: whenever you follow a link to a non-existing note, New Note Fixer first asks whether to create it in the current note's folder.

## Try it

<!-- obsidian-dev-utils-disable demo-vault-validation/no-wikilinks -- Clicking a link to a note that does not exist yet IS the feature, and a Markdown link to a missing note fails lint:md. -->

1. Open [04 Settings](<./04 Settings.md>) and set **New note location** to **Ask for current note folder first**.
2. Come back to this note (it lives in the vault root, but the mode works from any folder) and click this link to a note that does not exist yet: [[Sibling note]].
3. A dialog asks **"Create the new note in the current note's folder (...)?"**.
   - Click **OK** to open the folder picker pre-filled with this note's folder - press Enter to accept it, or adjust the folder first.
   - Click **Cancel** to open the folder picker pre-filled with your default location instead.
4. The new note is created in the folder you accepted, and the clicked link is repaired to point at it.

<!-- obsidian-dev-utils-enable demo-vault-validation/no-wikilinks -->

## What it does

- **Fluid same-folder creation**
  - the new note lands next to the note you are working in without you retyping the path.
- **Still your choice**
  - the confirm only *pre-fills* the picker; you can always override the folder before creating.
- **Falls back cleanly**
  - if there is no open source note, New Note Fixer skips the question and behaves like **Prompt for folder**.

The other placement modes - **Default location** and **Prompt for folder** - are described in [04 Settings](<./04 Settings.md>). See also [01 Subfolder link fix](<./01 Subfolder link fix.md>) and [02 Relative link fix](<./02 Relative link fix.md>).
