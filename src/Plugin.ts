import type { OpenViewState } from 'obsidian';

import {
  parseLinktext,
  Notice,
  WorkspaceLeaf
} from 'obsidian';
import { registerPatch } from 'obsidian-dev-utils/obsidian/MonkeyAround';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';
import { join } from 'obsidian-dev-utils/Path';

import type { PluginTypes } from './PluginTypes.ts';

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

export class Plugin extends PluginBase<PluginTypes> {
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
    const file = this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (file || path.startsWith('/')) {
      await next.call(leaf, linktext, sourcePath, openViewState);
      return;
    }

    const newFileParent = this.app.fileManager.getNewFileParent(sourcePath, 'dummy.md');
    const fullPath = join(newFileParent.path, `./${path}`);

    if (fullPath.startsWith('../')) {
      const message = `Wrong relative path: ${path}`;
      new Notice(message);
      console.error(message);
      return;
    }

    await next.call(leaf, `/${fullPath}${subpath}`, sourcePath, openViewState);
  }
}
