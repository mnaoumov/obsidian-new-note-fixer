# CHANGELOG

## 2.0.6

- chore: update libs
- refactor: use per-line eslint-disable for deprecated display() calls in tests
- chore: upgrade dependencies and green up all checks
- chore: update libs
- refactor: migrate to @obsidian-typings/obsidian-public-latest - Replace obsidian-typings with @obsidian-typings/obsidian-public-latest - Update vitest config: replace ssr.noExternal with server.deps.inline - Add DOM.Iterable to tsconfig lib - Remove obsolete overrides (@antfu/utils, boolean, dompurify) - Upgrade dependencies via npm-check-updates
- build: replace commitizen with czg Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- refactor: simplify PluginSettingsComponent constructor to accept plugin directly Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- refactor: pass pluginSettingsComponent instead of pluginSettings getter Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- refactor!: migrate to obsidian-dev-utils v2 component architecture - Replace createSettingsManager/createSettingsTab overrides with   registerComponent() pattern in constructor - Rename PluginSettingsManager to PluginSettingsComponent using   PluginSettingsComponentBase from obsidian-dev-utils - Delete PluginTypes.ts (no longer needed with non-generic PluginBase) - Rename all source files to kebab-case - Update import paths to obsidian-dev-utils v57 module structure - Add vitest test infrastructure with 43 tests and 100% line coverage - Add vitest, @vitest/coverage-v8 devDependencies and test scripts - Update tsconfig to ES2024 target/lib, add vitest.config.ts to include BREAKING CHANGE: requires obsidian-dev-utils v57+ with component-based plugin architecture. Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- chore: update libs
- chore: update template
- chore: update libs Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- chore: add @total-typescript/ts-reset, better-typescript-lib, and libReplacement Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
- chore: unify rules
- chore: add English language requirement to issue templates Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## 2.0.5

- chore: update template

## 2.0.4

- chore: update libs

## 2.0.3

- chore: update libs

## 2.0.2

- chore: update libs

## 2.0.1

- chore: update libs

## 2.0.0

- feat: add folder selector
  - fix #1

## 1.0.27

- fix: build
- chore: update libs

## 1.0.26

- chore: enable conventional commits

## 1.0.25

- Minor changes

## 1.0.24

- Minor changes

## 1.0.23

- Minor changes

## 1.0.22

- Minor changes

## 1.0.21

- Minor changes

## 1.0.20

- Minor changes

## 1.0.19

- Minor changes

## 1.0.18

- Minor changes

## 1.0.17

- Minor changes

## 1.0.16

- Minor changes

## 1.0.15

- Minor changes

## 1.0.14

- Minor changes

## 1.0.13

- Minor changes

## 1.0.12

- Minor changes

## 1.0.11

- Minor changes

## 1.0.10

- Minor changes

## 1.0.9

- Minor changes

## 1.0.8

- New template

## 1.0.7

- Minor changes

## 1.0.6

- Update template

## 1.0.5

- Minor changes

## 1.0.4

- Minor changes

## 1.0.3

- Minor changes

## 1.0.2

- Minor changes

## 1.0.1

- Add missing period

## 1.0.0

- Initial release
