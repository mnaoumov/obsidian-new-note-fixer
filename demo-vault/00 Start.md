Welcome to the [New Note Fixer](https://github.com/mnaoumov/obsidian-new-note-fixer/) demo vault. When you click a `[[link]]` to a note that does not exist yet, Obsidian creates it - but *where* it lands is inconsistent: a bare `[[note]]` follows your **Default location for new notes** setting, while `[[folder/note]]` ignores that setting and lands at the vault root, and `[[../folder/note]]` can even create a file **outside** the vault. **New Note Fixer** unifies all of these so every new note honors your **Default location for new notes** setting.

**How to try it:** open [[01 Subfolder link fix]] and click the link inside it. The note is created in the folder your settings say it should be, not blindly at the vault root. Then open [[02 Relative link fix]] to see the out-of-vault case handled cleanly.

## Feature

- [[01 Subfolder link fix]]
- [[02 Relative link fix]]
- [[03 Settings]]
