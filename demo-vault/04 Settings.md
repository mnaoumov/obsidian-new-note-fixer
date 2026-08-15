# Settings

Open **Settings -> Community plugins -> New Note Fixer** to configure the plugin. The option below lists the setting key stored in the plugin's `data.json`.

Each mode has a button, so you can try one and come straight back. They apply live - the plugin's own settings component saves them, so there is no reload:

```code-button
---
caption: Mode - Default location
---
await require('/demoSetup.ts').setNoteLocationMode(app, 'Default location');
```

```code-button
---
caption: Mode - Prompt for folder
---
await require('/demoSetup.ts').setNoteLocationMode(app, 'Prompt for folder');
```

```code-button
---
caption: Mode - Ask for current note folder first
---
await require('/demoSetup.ts').setNoteLocationMode(app, 'Ask for current note folder first');
```

Manual equivalent for all three: pick the mode from the **New note location** dropdown below.

## New note location

- `newNoteLocationMode`
  - controls where a new note is created when you click a link to a non-existing note. It has three modes:
  - `Default location` (the default) - the note is placed automatically under your **Default location for new notes**, and out-of-vault relative links (`[[../folder/note]]`) are refused with a notice - see [02 Relative link fix](<./02 Relative link fix.md>).
  - `Prompt for folder`
    - a folder picker opens so you choose where the new note is created. The picker also lets you type a new folder name to create it on the spot.
  - `Ask for current note folder first`
    - New Note Fixer first asks whether to create the note in the current note's folder. Confirming opens the folder picker pre-filled with the current note's folder; declining opens it pre-filled with the default location. Either way you can still adjust the folder before creating.

Upgrading from an older version keeps your previous choice: the old `shouldPromptForFolderLocation` toggle maps to `Prompt for folder` when it was on and `Default location` when it was off.
