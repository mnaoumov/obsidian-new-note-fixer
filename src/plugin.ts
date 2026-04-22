import type {
  App,
  OpenViewState,
  PluginManifest
} from 'obsidian';

import {
  Notice,
  parseLinktext,
  WorkspaceLeaf
} from 'obsidian';
import {
  editLinks,
  generateMarkdownLink
} from 'obsidian-dev-utils/obsidian/link';
import { registerPatch } from 'obsidian-dev-utils/obsidian/monkey-around';
import { PluginSettingsTabComponent } from 'obsidian-dev-utils/obsidian/plugin/components/plugin-settings-tab-component';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';
import {
  basename,
  dirname,
  join
} from 'obsidian-dev-utils/path';

import type { PluginSettings } from './plugin-settings.ts';

import { selectFolder } from './folder-selector.ts';
import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { PluginSettingsTab } from './plugin-settings-tab.ts';

type OpenLinkTextFn = WorkspaceLeaf['openLinkText'];

export class Plugin extends PluginBase {
  private readonly pluginSettingsComponent: PluginSettingsComponent;

  private get pluginSettings(): PluginSettings {
    return this.pluginSettingsComponent.settings;
  }

  public constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.pluginSettingsComponent = this.registerComponent({
      component: new PluginSettingsComponent({
        loadData: this.loadData.bind(this),
        saveData: this.saveData.bind(this)
      }),
      shouldPreload: true
    });
    this.registerComponent({
      component: new PluginSettingsTabComponent(
        this,
        new PluginSettingsTab({
          plugin: this,
          pluginSettingsComponent: this.pluginSettingsComponent
        })
      )
    });
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();
    const that = this;
    registerPatch(this, WorkspaceLeaf.prototype, {
      openLinkText: (next: OpenLinkTextFn): OpenLinkTextFn =>
        /* v8 ignore start -- inner function is called by Obsidian's monkey-patch runtime, not testable in unit tests. */
        function openLinkText(this: WorkspaceLeaf, linktext, sourcePath, openViewState) {
          return that.openLinkText(next, this, linktext, sourcePath, openViewState);
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

    if (this.pluginSettings.shouldPromptForFolderLocation) {
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
