import type { PluginNoticeComponent } from '@mnaoumov/obsidian-lib/components/plugin-notice-component';
import type { ResourceLockComponent } from '@mnaoumov/obsidian-lib/resource-lock';
import type { App } from 'obsidian';

import { MonkeyAroundComponent } from '@mnaoumov/obsidian-lib/components/monkey-around-component';
import { appendCodeBlock } from '@mnaoumov/obsidian-lib/html-element';
import {
  editLinks,
  generateMarkdownLink
} from '@mnaoumov/obsidian-lib/link';
import { confirm } from '@mnaoumov/obsidian-lib/modals/confirm';
import {
  basename,
  dirname,
  join
} from '@mnaoumov/typescript-lib/path';
import {
  parseLinktext,
  WorkspaceLeaf
} from 'obsidian';

import type { PluginSettingsComponent } from '../plugin-settings-component.ts';

import { selectFolder } from '../folder-selector.ts';
import { NewNoteLocationMode } from '../plugin-settings.ts';

interface WorkspaceLeafOpenLinkTextPatchComponentConstructorParams {
  readonly app: App;
  readonly pluginNoticeComponent: PluginNoticeComponent;
  readonly pluginSettingsComponent: PluginSettingsComponent;
  readonly resourceLockComponent: null | ResourceLockComponent;
}

export class WorkspaceLeafOpenLinkTextPatchComponent extends MonkeyAroundComponent {
  private readonly app: App;
  private readonly pluginNoticeComponent: PluginNoticeComponent;
  private readonly pluginSettingsComponent: PluginSettingsComponent;
  private readonly resourceLockComponent: null | ResourceLockComponent;

  public constructor(params: WorkspaceLeafOpenLinkTextPatchComponentConstructorParams) {
    super();
    this.app = params.app;
    this.resourceLockComponent = params.resourceLockComponent;
    this.pluginNoticeComponent = params.pluginNoticeComponent;
    this.pluginSettingsComponent = params.pluginSettingsComponent;
  }

  public override onload(): void {
    this.registerMethodPatch({
      $object: WorkspaceLeaf.prototype,
      methodName: 'openLinkText',
      patchHandler: async ({
        fallback,
        originalArguments: [linktext, sourcePath, openViewState],
        originalMethodBound
      }) => {
        const { path, subpath } = parseLinktext(linktext);
        let linkedFile = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (linkedFile) {
          await fallback();
          return;
        }

        // A link starting with `./` or `../` names its folder relative to the linking note, the way Obsidian resolves an existing target.
        const isRelativeToSourceNote = sourcePath !== '' && isExplicitlyRelativePath(path);

        let fullPath: string;
        if (path.startsWith('/')) {
          fullPath = path;
        } else if (isRelativeToSourceNote) {
          fullPath = join(dirname(sourcePath), path);
        } else {
          const newFileParent = this.app.fileManager.getNewFileParent(sourcePath, 'dummy.md');
          fullPath = join(newFileParent.path, `./${path}`);
        }

        if (fullPath.startsWith('/')) {
          fullPath = fullPath.slice(1);
        }

        const mode = this.pluginSettingsComponent.settings.newNoteLocationMode;

        if (mode === NewNoteLocationMode.DefaultLocation) {
          if (fullPath.startsWith('../')) {
            const message = `Wrong relative path: ${path}`;
            this.pluginNoticeComponent.showNotice(message);
            console.error(message);
            return;
          }
        } else {
          let directory = dirname(fullPath);
          if (directory === '.') {
            directory = '/';
          }

          // A relative link already anchors at the current note's folder, so asking would only drop its subfolder.
          if (mode === NewNoteLocationMode.AskForCurrentNoteFolderFirst && sourcePath && !isRelativeToSourceNote) {
            let currentNoteFolder = dirname(sourcePath);
            if (currentNoteFolder === '.') {
              currentNoteFolder = '/';
            }
            const shouldUseCurrentNoteFolder = await confirm({
              app: this.app,
              message: `Create the new note in the current note’s folder (${currentNoteFolder})?`,
              title: createFragment((f) => {
                appendCodeBlock(f, 'New Note Fixer');
              })
            });
            if (shouldUseCurrentNoteFolder) {
              directory = currentNoteFolder;
            }
          }

          const folder = await selectFolder(this.app, directory);
          if (!folder) {
            return;
          }
          fullPath = join(folder.path, basename(fullPath));
        }

        await originalMethodBound(`/${fullPath}${subpath}`, sourcePath, openViewState);

        const createdFile = this.app.metadataCache.getFirstLinkpathDest(fullPath, sourcePath);
        linkedFile = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (linkedFile !== createdFile && createdFile) {
          await editLinks({
            app: this.app,
            linkConverter: (link) => {
              if (link.link !== linktext) {
                return;
              }
              return generateMarkdownLink({
                app: this.app,
                originalLink: link.original,
                sourcePathOrFile: sourcePath,
                targetPathOrFile: createdFile
              });
            },
            pathOrFile: sourcePath,
            pluginNoticeComponent: this.pluginNoticeComponent,
            resourceLockComponent: this.resourceLockComponent
          });
        }
      }
    });
  }
}

function isExplicitlyRelativePath(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}
