import type { OpenViewState } from 'obsidian';

import {
  Notice,
  parseLinktext,
  WorkspaceLeaf
} from 'obsidian';
import {
  editLinks,
  generateMarkdownLink
} from 'obsidian-dev-utils/obsidian/Link';
import { registerPatch } from 'obsidian-dev-utils/obsidian/MonkeyAround';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';
import {
  basename,
  dirname,
  join
} from 'obsidian-dev-utils/Path';

import type { PluginTypes } from './PluginTypes.ts';

import { selectFolder } from './FolderSelector.ts';
import { PluginSettingsManager } from './PluginSettingsManager.ts';
import { PluginSettingsTab } from './PluginSettingsTab.ts';

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

export class Plugin extends PluginBase<PluginTypes> {
  protected override createSettingsManager(): PluginSettingsManager {
    return new PluginSettingsManager(this);
  }

  protected override createSettingsTab(): PluginSettingsTab {
    return new PluginSettingsTab(this);
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();
    const that = this;
    registerPatch(this, WorkspaceLeaf.prototype, {
      openLinkText: (next: OpenLinkTextFn): OpenLinkTextFn =>
        function openLinkText(this: WorkspaceLeaf, linktext, sourcePath, openViewState) {
          return that.openLinkText(next, this, linktext, sourcePath, openViewState);
        }
    });
  }

  private async openLinkText(next: OpenLinkTextFn, leaf: WorkspaceLeaf, linktext: string, sourcePath: string, openViewState?: OpenViewState): Promise<void> {
    const { path, subpath } = parseLinktext(linktext);
    let linkedFile = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (linkedFile) {
      await next.call(leaf, linktext, sourcePath, openViewState);
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

    if (this.settings.shouldPromptForFolderLocation) {
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

    await next.call(leaf, `/${fullPath}${subpath}`, sourcePath, openViewState);

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
}
