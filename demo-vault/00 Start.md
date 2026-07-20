Welcome to the [New Note Fixer](https://github.com/mnaoumov/obsidian-new-note-fixer/) demo vault. When you click a `[[link]]` to a note that does not exist yet, Obsidian creates it - but *where* it lands is inconsistent: a bare `[[note]]` follows your **Default location for new notes** setting, while `[[folder/note]]` ignores that setting and lands at the vault root, and `[[../folder/note]]` can even create a file **outside** the vault. **New Note Fixer** unifies all of these so every new note honors your **Default location for new notes** setting.

**How to try it:** open [[01 Subfolder link fix]] and click the link inside it. The note is created in the folder your settings say it should be, not blindly at the vault root. Then open [[02 Relative link fix]] to see the out-of-vault case handled cleanly.

> [!TIP] Interactive buttons
>
> The two setup notes have **Run** buttons, powered by [`CodeScript Toolkit`](https://github.com/mnaoumov/obsidian-codescript-toolkit/), which this vault installs for you automatically on first open (see [[05 CodeScript Toolkit prerequisite]]). The fix itself just happens when you click a link, so the feature notes have no buttons.

## Feature

- [[01 Subfolder link fix]]
- [[02 Relative link fix]]
- [[03 Settings]]

## Setup

- [[04 Code buttons check]]
- [[05 CodeScript Toolkit prerequisite]]
