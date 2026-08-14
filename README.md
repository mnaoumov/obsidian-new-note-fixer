# New Note Fixer

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/mnaoumov)
[![GitHub release](https://img.shields.io/github/v/release/mnaoumov/obsidian-new-note-fixer)](https://github.com/mnaoumov/obsidian-new-note-fixer/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/mnaoumov/obsidian-new-note-fixer/total)](https://github.com/mnaoumov/obsidian-new-note-fixer/releases)
[![Coverage: 100%](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/mnaoumov/obsidian-new-note-fixer)

Clicking a link to a note that does not exist yet creates it — and where it lands depends on which
*shape* the link has, in ways [Obsidian](https://obsidian.md/) never explains:

- `[[non-existing-note]]` respects `Settings → Files and links → Default location for new notes`.
- `[[folder/non-existing-note]]` ignores that setting entirely and creates the note at the **vault
  root**, under `folder/`.
- `[[../folder/non-existing-note]]` creates a file **outside the vault**, does not open it, and on the
  second click reports the misleading error `Folder already exists`.

This plugin makes all three obey the setting you configured, so where a new note appears no longer
depends on how the link that created it happened to be written.

## Demo vault

**The documentation is a demo vault.** Every case has a note that explains what Obsidian does, what the
plugin does instead, and a link you can click to watch it happen.

**[Start reading here](<./demo-vault/00 Start.md>)** — it is plain markdown, so it works on GitHub with
nothing installed.

A copy of the vault ships with every release. You can access it via any of the following:

1. Running the **New Note Fixer: Open demo vault** command.
2. Downloading `new-note-fixer-demo-vault-<version>.zip` (`<version>` is the release version) from the [Releases](https://github.com/mnaoumov/obsidian-new-note-fixer/releases).
3. Browsing its source in [`demo-vault/`](./demo-vault/README.md) in this repository.

## What it does

- **A link with a folder in it** stops ignoring your default-location setting.
  [01 Subfolder link fix](<./demo-vault/01 Subfolder link fix.md>)
- **A link that climbs out of the vault** (`../`) stops creating files outside it, and stops the
  `Folder already exists` message that follows.
  [02 Relative link fix](<./demo-vault/02 Relative link fix.md>)
- **`Same folder as current file`** keeps working the way you would expect for every link shape.
  [03 Current note folder](<./demo-vault/03 Current note folder.md>)
- **Every setting**, by the key it is stored under.
  [04 Settings](<./demo-vault/04 Settings.md>)

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

For more details, refer to the [documentation](https://mnaoumov.dev/obsidian-dev-utils/guides/debugging/).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md).

## Contributing

Contributions are welcome — see [CONTRIBUTING](./CONTRIBUTING.md) to get set up.

## Support

<!-- markdownlint-disable MD033 -->

<a href="https://www.buymeacoffee.com/mnaoumov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>

<!-- markdownlint-enable MD033 -->

## My other Obsidian resources

[See my other Obsidian resources](https://github.com/mnaoumov/obsidian-resources).

## License

© [Michael Naumov](https://github.com/mnaoumov/)
