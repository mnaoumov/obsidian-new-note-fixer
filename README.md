# New Note Fixer

This is a plugin for [Obsidian](https://obsidian.md/) that unifies the way non-existing notes are created when clicking on their links.

When you click on a link `[[non-existing-note]]`, Obsidian creates a new note, whose location depends on `Settings → Files and links → Default location for new notes`.

However, if your link is `[[folder/non-existing-note]]`, Obsidian will ignore the above-mentioned setting and create a new note in the `<vault root>/folder/non-existing-note.md`.

Even more, if the link is `[[../folder/non-existing-note]]`, Obsidian will create a file outside of the vault root and won't open it. If you click on the link another time, Obsidian will show a misleading error message `Folder already exists`.

This plugin fixes this behavior by respecting `Default location for new notes` setting for those cases.

## Installation

- `New Note Fixer` is not available in [the official Community Plugins repository](https://obsidian.md/plugins) yet.
- Beta releases can be installed through [BRAT](https://obsidian.md/plugins?id=obsidian42-brat).

## Debugging

By default, debug messages for this plugin are hidden.

To show them, run the following command:

```js
window.DEBUG.enable('new-note-fixer');
```

For more details, refer to the [documentation](https://github.com/mnaoumov/obsidian-dev-utils?tab=readme-ov-file#debugging).

## Support

<a href="https://www.buymeacoffee.com/mnaoumov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a>

## License

© [Michael Naumov](https://github.com/mnaoumov/)
