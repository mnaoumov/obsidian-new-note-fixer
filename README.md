# New Note Fixer

This is a plugin for [Obsidian](https://obsidian.md/) that unifies the way non-existing notes are created when clicking on their links.

When you click on a link `[[non-existing-note]]`, Obsidian creates a new note, whose location depends on `Settings → Files and links → Default location for new notes`.

However, if your link is `[[folder/non-existing-note]]`, Obsidian will ignore the above-mentioned setting and create a new note in the `<vault root>/folder/non-existing-note.md`.

Even more, if the link is `[[../folder/non-existing-note]]`, Obsidian will create a file outside of the vault root and won't open it. If you click on the link another time, Obsidian will show a misleading error message `Folder already exists`.

This plugin fixes this behavior by respecting `Default location for new notes` setting for those cases.

## Installation

The plugin is available in [the official Community Plugins repository](https://obsidian.md/plugins?id=new-note-fixer).

### Beta versions

To install the latest beta release of this plugin (regardless if it is available in [the official Community Plugins repository](https://obsidian.md/plugins) or not), follow these steps:

1. Ensure you have the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat) installed and enabled.
2. Click [Install via BRAT](https://intradeus.github.io/http-protocol-redirector?r=obsidian://brat?plugin=https://github.com/mnaoumov/obsidian-new-note-fixer).
3. An Obsidian pop-up window should appear. In the window, click the `Add plugin` button once and wait a few seconds for the plugin to install.

## Debugging

By default, debug messages for this plugin are hidden.

To show them, run the following command:

```js
window.DEBUG.enable('new-note-fixer');
```

For more details, refer to the [documentation](https://github.com/mnaoumov/obsidian-dev-utils/blob/main/docs/debugging.md).

## Support

<!-- markdownlint-disable MD033 -->
<a href="https://www.buymeacoffee.com/mnaoumov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>
<!-- markdownlint-enable MD033 -->

## License

© [Michael Naumov](https://github.com/mnaoumov/)
