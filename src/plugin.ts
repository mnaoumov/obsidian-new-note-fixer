import type { OpenViewState } from 'obsidian';

import {
  Notice,
  parseLinktext,
  WorkspaceLeaf
} from 'obsidian';
import { MonkeyAroundComponent } from 'obsidian-dev-utils/obsidian/components/monkey-around-component';
import { PluginSettingsTabComponent } from 'obsidian-dev-utils/obsidian/components/plugin-settings-tab-component';
import { PluginDataHandler } from 'obsidian-dev-utils/obsidian/data-handler';
import {
  editLinks,
  generateMarkdownLink
} from 'obsidian-dev-utils/obsidian/link';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';
import { PluginEventSourceImpl } from 'obsidian-dev-utils/obsidian/plugin/plugin-event-source';
import {
  basename,
  dirname,
  join
} from 'obsidian-dev-utils/path';
import { ensureNonNullable } from 'obsidian-dev-utils/type-guards';
import { ValueWrapper } from 'obsidian-dev-utils/value-wrapper';

import { selectFolder } from './folder-selector.ts';
import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { PluginSettingsTab } from './plugin-settings-tab.ts';

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

export class Plugin extends PluginBase {
  private pluginSettingsComponent?: PluginSettingsComponent;

  protected override onloadImpl(): void {
    const monkeyAroundComponent = this.addChild(new MonkeyAroundComponent());
    const pluginSettingsComponent = this.addChild(
      new PluginSettingsComponent({
        dataHandler: new PluginDataHandler(this),
        pluginEventSource: new PluginEventSourceImpl(this)
      })
    );
    this.pluginSettingsComponent = pluginSettingsComponent;
    this.addChild(
      new PluginSettingsTabComponent({
        plugin: this,
        pluginSettingsTab: new PluginSettingsTab({
          plugin: this,
          pluginSettingsComponent
        })
      })
    );

    const thisWrapper = ValueWrapper.of(this);
    monkeyAroundComponent.registerPatch(WorkspaceLeaf.prototype, {
      openLinkText: (next: OpenLinkTextFn): OpenLinkTextFn =>
        /* v8 ignore start -- inner function is called by Obsidian's monkey-patch runtime, not testable in unit tests. */
        function openLinkText(this: WorkspaceLeaf, linktext, sourcePath, openViewState) {
          return thisWrapper.value.openLinkText(next, this, linktext, sourcePath, openViewState);
        }
      /* v8 ignore stop */
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

    if (ensureNonNullable(this.pluginSettingsComponent).settings.shouldPromptForFolderLocation) {
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
