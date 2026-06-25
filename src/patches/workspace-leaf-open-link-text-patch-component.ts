import type { App } from 'obsidian';

import {
  Notice,
  parseLinktext,
  WorkspaceLeaf
} from 'obsidian';
import { MonkeyAroundComponent } from 'obsidian-dev-utils/obsidian/components/monkey-around-component';
import {
  editLinks,
  generateMarkdownLink
} from 'obsidian-dev-utils/obsidian/link';
import {
  basename,
  dirname,
  join
} from 'obsidian-dev-utils/path';

import type { PluginSettingsComponent } from '../plugin-settings-component.ts';

import { selectFolder } from '../folder-selector.ts';

interface WorkspaceLeafOpenLinkTextPatchComponentConstructorParams {
  readonly app: App;
  readonly pluginSettingsComponent: PluginSettingsComponent;
}

export class WorkspaceLeafOpenLinkTextPatchComponent extends MonkeyAroundComponent {
  private readonly app: App;
  private readonly pluginSettingsComponent: PluginSettingsComponent;

  public constructor(params: WorkspaceLeafOpenLinkTextPatchComponentConstructorParams) {
    super();
    this.app = params.app;
    this.pluginSettingsComponent = params.pluginSettingsComponent;
  }

  public override onload(): void {
    this.registerMethodPatch({
      methodName: 'openLinkText',
      obj: WorkspaceLeaf.prototype,
      patchHandler: async ({
        fallback,
        originalArgs: [linktext, sourcePath, openViewState],
        originalMethodBound
      }) => {
        const { path, subpath } = parseLinktext(linktext);
        let linkedFile = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (linkedFile) {
          await fallback();
          return;
        }

        let fullPath: string;
        if (path.startsWith('/')) {
          fullPath = path;
        } else {
          const newFileParent = this.app.fileManager.getNewFileParent(sourcePath, 'dummy.md');
          fullPath = join(newFileParent.path, `./${path}`);
        }

        if (fullPath.startsWith('/')) {
          fullPath = fullPath.slice(1);
        }

        if (this.pluginSettingsComponent.settings.shouldPromptForFolderLocation) {
          let dir = dirname(fullPath);
          if (dir === '.') {
            dir = '/';
          }
          const folder = await selectFolder(this.app, dir);
          if (!folder) {
            return;
          }
          fullPath = join(folder.path, basename(fullPath));
        } else if (fullPath.startsWith('../')) {
          const message = `Wrong relative path: ${path}`;
          new Notice(message);
          console.error(message);
          return;
        }

        await originalMethodBound(`/${fullPath}${subpath}`, sourcePath, openViewState);

        const createdFile = this.app.metadataCache.getFirstLinkpathDest(fullPath, sourcePath);
        linkedFile = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (linkedFile !== createdFile && createdFile) {
          await editLinks(this.app, sourcePath, (link) => {
            if (link.link !== linktext) {
              return;
            }
            return generateMarkdownLink({
              app: this.app,
              originalLink: link.original,
              sourcePathOrFile: sourcePath,
              targetPathOrFile: createdFile
            });
          });
        }
      }
    });
  }
}
