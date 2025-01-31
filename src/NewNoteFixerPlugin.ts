import type { OpenViewState } from 'obsidian';

import { around } from 'monkey-around';
import {
  parseLinktext,
  PluginSettingTab,
  WorkspaceLeaf
} from 'obsidian';
import { EmptySettings } from 'obsidian-dev-utils/obsidian/Plugin/EmptySettings';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';
import { join } from 'obsidian-dev-utils/Path';

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

export class NewNoteFixerPlugin extends PluginBase {
  protected override createPluginSettings(): EmptySettings {
    return new EmptySettings();
  }

  protected override createPluginSettingsTab(): null | PluginSettingTab {
    return null;
  }

  protected override onloadComplete(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.register(around(WorkspaceLeaf.prototype, {
      openLinkText: (next: OpenLinkTextFn): OpenLinkTextFn =>
        function openLinkText(this: WorkspaceLeaf, linktext, sourcePath, openViewState) {
          return that.openLinkText(next, this, linktext, sourcePath, openViewState);
        }
    }));
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
