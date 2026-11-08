# CHANGELOG

## 2.5.0

This release has 1 new feature and 4 documentation changes. 7 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### New

- add a Report a bug command

### Documentation

- **readme:** point bug reports at the Report a bug command
- add issue-filing instructions for AI agents
- **readme:** combine related resources and plugin comparisons
- **readme:** add a Similar plugins section

## 2.4.1

This release has 1 fix and 6 documentation changes. 4 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- **demo-vault:** load the demo setup helpers from @mnaoumov/obsidian-lib

### Documentation

- name `obsidian-lib` where comments said dev-utils
- shorten the debugging section
- **changelog:** escape the issue-title tags so `markdownlint` and `cspell` pass
- **changelog:** name the issue each released entry resolved
- **readme:** lead the Debugging section with `Advanced Debug Mode`
- mark plugin names as code

## 2.4.0

This release has 1 new feature and 1 documentation change. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### New

- merge resolving ./ and ../ new-note links from the linking note's folder (re #2 - \[FR\] Support relative paths)

### Documentation

- **demo-vault:** give the relative link fix Try it its setup and step buttons

## 2.3.1

This release has 1 fix. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- mark plugin names as code in the confirm title, markdown and comments

## 2.3.0

This release has 1 new feature, 5 fixes and 7 documentation changes. 14 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### New

- **folder-picker:** spell-check the box, which names the folder it will create

### Fixed

- **test:** merge the headless demo-vault toolkit install
- **deps:** restore the lockfile's missing resolved and integrity fields
- **deps:** float devalue to 5.9.4, clearing GHSA-9rgm-9g3h-6x36
- **deps:** move to `obsidian-integration-testing` 12 and `obsidian-dev-utils` 101
- **build:** wire build:compile to buildCompile and drop the duplicate leaf script

### Documentation

- **screenshots:** merge the caret-free desktop frame 1
- replace the private rule-id citations with what they assert
- name the library and the sibling plugins so a reader can resolve them
- replace the private tracker references with what they pointed at
- say where the debug command is run
- **agents:** record where the picker's spellcheck rule now lives
- name the unversioned demo-vault asset and the folder it unzips into

## 2.2.5

This release has 2 fixes and 1 documentation change. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### Fixed

- **deps:** move to `obsidian-integration-testing` 11 and `obsidian-dev-utils` 96.5.2
- **deps:** drop the brace-expansion file: override that breaks a clean install

### Documentation

- point plugin-directory links at community.obsidian.md

## 2.2.4

This release has 1 fix and 3 documentation changes. 6 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- override deepmerge-ts to clear GHSA-ggr8-5vv4-36mx

### Documentation

- **readme:** render the same in Obsidian's plugin page as on `GitHub`
- **demo-vault:** give the demo vault its code buttons
- capture the community-store screenshot set

## 2.2.3

This release has 1 new feature and 1 documentation change.

### New

- **demo-vault:** migrate to `obsidian-dev-utils` 93.3.1 and adopt the authoring convention

### Documentation

- make the demo vault the documentation, in the standard layout

## 2.2.2

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.2.1

This release has maintenance changes only. 4 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

## 2.2.0

This release has 1 documentation change. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Documentation

- fix the demo vault download instructions

## 2.1.0

This release has 1 new feature. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### New

- add "ask for current note folder first" location mode (re #5)

## 2.0.13

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.12

This release has 1 fix. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- **demo-vault:** export invoke() from startup script; add Invocables folder

## 2.0.11

This release has 4 documentation changes. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Documentation

- standardize demo-vault README
- drop per-plugin demo-vault setup notes (bootstrap covered by the `obsidian-dev-utils` harness)
- **demo-vault:** create the `New Note Fixer` demo vault
- migrate to AGENTS.md

## 2.0.10

This release has maintenance changes only. 7 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

## 2.0.9

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.8

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.7

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.6

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.5

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.4

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.3

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.2

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.1

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 2.0.0

- feat: add folder selector
  - fix #1

## 1.0.27

This release has 1 fix. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### Fixed

- build

## 1.0.26

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.0.25

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.24

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.23

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.22

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.21

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.20

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.19

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.18

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.17

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.16

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.15

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.14

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.13

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.12

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.11

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.10

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.9

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.8

This release has 1 other change.

### Other changes

- New template

## 1.0.7

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.6

This release has 1 other change.

### Other changes

- Update template

## 1.0.5

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.4

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.3

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.2

This release has 1 other change.

### Other changes

- Minor changes

## 1.0.1

This release has 1 other change.

### Other changes

- Add missing period

## 1.0.0

This release has 1 other change.

### Other changes

- Initial release
