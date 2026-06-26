# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

New Note Fixer is an Obsidian plugin that unifies the way non-existing notes are created when clicking on their links. It patches `WorkspaceLeaf.openLinkText` so that following a link to a missing note resolves the target path consistently (optionally prompting for the destination folder) and rewrites the source link to the created file. It is built on `obsidian-dev-utils`.

## Commands

| Task              | Command                    |
|-------------------|----------------------------|
| TypeScript check  | `npm run build:compile`    |
| Build             | `npm run build`            |
| Dev (watch)       | `npm run dev`              |
| Lint              | `npm run lint`             |
| Lint (fix)        | `npm run lint:fix`         |
| Format            | `npm run format`           |
| Format (check)    | `npm run format:check`     |
| Spellcheck        | `npm run spellcheck`       |
| Markdown lint     | `npm run lint:md`          |
| Markdown lint fix | `npm run lint:md:fix`      |
| Unit tests        | `npm test`                 |
| Coverage          | `npm run test:coverage`    |
| Integration tests | `npm run test:integration` |
| Commit (wizard)   | `npm run commit`           |

## Architecture

- **Root config files** are thin re-exports — actual logic lives in `scripts/` (`eslint.config.mts` → `scripts/eslint-config.ts`, etc.).
- **`src/`** — plugin source:
  - `main.ts` — Obsidian entry point (default export of `Plugin`)
  - `plugin.ts` — `Plugin` class extending dev-utils' `PluginBase`; in `onloadImpl` wires up the settings component, the settings tab, and the `openLinkText` patch as child components
  - `plugin-settings.ts` — `PluginSettings` data class (single setting: `shouldPromptForFolderLocation`)
  - `plugin-settings-component.ts` — `PluginSettingsComponent` extending dev-utils' `PluginSettingsComponentBase`, bound to `PluginSettings`
  - `plugin-settings-tab.ts` — `PluginSettingsTab` extending dev-utils' `PluginSettingsTabBase`; renders the "Should prompt for folder location" toggle
  - `folder-selector.ts` — `FolderSelectorModal` (`FuzzySuggestModal` subclass) plus `selectFolder`, a fuzzy multi-part folder picker that can also create a new folder from the typed query
  - `patches/workspace-leaf-open-link-text-patch-component.ts` — `WorkspaceLeafOpenLinkTextPatchComponent` extending dev-utils' `MonkeyAroundComponent`; patches `WorkspaceLeaf.prototype.openLinkText` to resolve/create the target note path (optionally prompting for a folder) and rewrite the source link to the created file
- **`main` field** points to `src/main.ts` (Obsidian plugin source entry; built artifact is `dist/build/main.js`, not published to npm).

## Known Issues

None.
