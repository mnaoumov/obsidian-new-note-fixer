import type {
  App,
  FuzzyMatch,
  SearchResult,
  TFolder
} from 'obsidian';

import { applySpellcheckMode } from '@mnaoumov/obsidian-lib/html-element';
import { SpellcheckMode } from '@mnaoumov/obsidian-lib/obsidian-settings';
import { invokeAsyncSafely } from '@mnaoumov/typescript-lib/async';
import {
  FuzzySuggestModal,
  prepareFuzzySearch,
  sortSearchResults,
  TFile
} from 'obsidian';

/*
 * The recent-folders section is adapted from `Create In Chosen Folder`
 * (https://github.com/bubbatlc/create-in-chosen-folder), used under the MIT License:
 *
 * Copyright (c) 2026 Bubba Chabot
 *
 * The full license text is in THIRD-PARTY-NOTICES.md.
 */

interface FolderSelectorModalConstructorParams extends SelectFolderParams {
  readonly resolve: (this: void, folder: null | TFolder) => void;
}

interface SelectFolderParams {
  readonly app: App;
  readonly initialQuery: string;
  readonly recentFolderCount: number;
}

class FolderSelectorModal extends FuzzySuggestModal<null | TFolder> {
  private initialQuery: string;
  private isSelected = false;
  private orderedFolders: null | TFolder[] = null;
  private readonly recentFolderCount: number;
  private readonly recentFolders = new Set<TFolder>();
  private readonly resolve: (folder: null | TFolder) => void;

  public constructor(params: FolderSelectorModalConstructorParams) {
    super(params.app);
    this.initialQuery = params.initialQuery;
    this.recentFolderCount = params.recentFolderCount;
    this.resolve = params.resolve;
  }

  /**
   * Every folder, the {@link recentFolderCount} folders holding the most recently created notes first, newest first.
   * Worked out once per picker rather than on every keystroke.
   *
   * @returns The ordered folders.
   */
  public override getItems(): TFolder[] {
    this.orderedFolders ??= this.orderFolders();
    return this.orderedFolders;
  }

  public override getItemText(item: null | TFolder): string {
    return item?.path ?? '';
  }

  public override getSuggestions(query: string): FuzzyMatch<null | TFolder>[] {
    query = query.trim();
    if (!query) {
      return super.getSuggestions(query);
    }

    const queryParts = query.split(/[\s/]+/).filter((p) => !!p);
    const searchFunctions = queryParts.map((part) => prepareFuzzySearch(part));
    const folders = this.getItems();
    const results: FuzzyMatch<null | TFolder>[] = [];

    for (const folder of folders) {
      const partMatches: SearchResult[] = [];
      let isAllPartsMatch = true;

      for (const searchFunction of searchFunctions) {
        const match = searchFunction(folder.path);

        if (match) {
          partMatches.push(match);
        } else {
          isAllPartsMatch = false;
          break;
        }
      }

      if (!isAllPartsMatch) {
        continue;
      }

      const totalScore = partMatches.reduce((sum, m) => sum + m.score, 0);
      const allMatches = partMatches.flatMap((m) => m.matches).sort((a, b) => a[0] - b[0]);

      results.push({
        item: folder,
        match: {
          matches: allMatches,
          score: totalScore
        }
      });
    }

    sortSearchResults(results);

    /*
     * A query with no search parts (the `/` prefill) matches every folder at score 0, so the stable sort keeps the
     * recent folders on top. The folder the query names exactly still leads, so Enter keeps choosing it.
     */
    const exactMatch = results.find((result) => result.item?.path === query);
    if (exactMatch) {
      results.splice(results.indexOf(exactMatch), 1);
      results.unshift(exactMatch);
    } else {
      results.unshift({ item: null, match: { matches: [], score: 0 } });
    }
    return results;
  }

  public override onChooseItem(item: null | TFolder): void {
    if (item) {
      this.resolve(item);
    } else {
      invokeAsyncSafely(async () => {
        try {
          const folder = await this.app.vault.createFolder(this.inputEl.value);
          this.resolve(folder);
          this.isSelected = true;
        } catch {
          this.initialQuery = this.inputEl.value;
          this.open();
        }
      });
    }
  }

  public override onClose(): void {
    super.onClose();
    if (!this.isSelected) {
      this.resolve(null);
    }
  }

  public override onNoSuggestion(): void {
    super.onNoSuggestion();
    const emptyMatch: FuzzyMatch<null | TFolder> = { item: null, match: { matches: [], score: 0 } };
    this.chooser.setSuggestions([emptyMatch]);
    this.renderSuggestion(emptyMatch, createDiv());
  }

  public override onOpen(): void {
    super.onOpen();
    this.setPlaceholder('Select a folder...');
    /*
     * Obsidian builds every `SuggestModal` input with a hardcoded `spellcheck="false"` and never consults
     * `Editor > Spellcheck`. Right for a box that only FINDS a folder, but this one always offers to
     * CREATE the folder named in it — the top row is `Enter to create`, and `onChooseItem` passes
     * `inputEl.value` straight to `vault.createFolder`. So it is a name field at all times, not only in
     * some mode, which is why the setting is followed unconditionally here.
     *
     * A folder name is a PATH, so segments get checked too. That is what Obsidian's own inline rename
     * does, and the alternative — checking only the last segment — cannot be expressed as an attribute.
     */
    applySpellcheckMode({
      app: this.app,
      element: this.inputEl,
      spellcheckMode: SpellcheckMode.FollowObsidianSetting
    });
    this.inputEl.value = this.initialQuery;
    this.updateSuggestions();
  }

  public override renderSuggestion(item: FuzzyMatch<null | TFolder>, el: HTMLElement): void {
    super.renderSuggestion(item, el);
    if (item.item) {
      if (this.recentFolders.has(item.item)) {
        el.createSpan({ cls: ['suggestion-flair', 'new-note-fixer-recent-folder'], text: 'recent' });
      }
      return;
    }

    el.addClass('suggestion-item', 'mod-complex');
    el.empty();
    const suggestionContent = el.createDiv('suggestion-content');
    const suggestionAux = el.createDiv('suggestion-aux');
    suggestionContent.createDiv({ cls: 'suggestion-title', text: this.inputEl.value });
    suggestionAux.createSpan({
      cls: 'suggestion-action',
      text: 'Enter to create'
    });
  }

  public override selectSuggestion(value: FuzzyMatch<null | TFolder>, $event: KeyboardEvent | MouseEvent): void {
    this.isSelected = true;
    super.selectSuggestion(value, $event);
  }

  private orderFolders(): TFolder[] {
    const folders = this.app.vault.getAllFolders(true);
    this.recentFolders.clear();
    if (this.recentFolderCount <= 0) {
      return folders;
    }

    // A folder is as recent as the newest note created directly inside it.
    const newestNoteCreationTimes = new Map<TFolder, number>();
    for (const folder of folders) {
      let newestCreationTime = 0;
      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === 'md') {
          newestCreationTime = Math.max(newestCreationTime, child.stat.ctime);
        }
      }
      if (newestCreationTime > 0) {
        newestNoteCreationTimes.set(folder, newestCreationTime);
      }
    }

    const recentFolders = [...newestNoteCreationTimes]
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.recentFolderCount)
      .map(([folder]) => folder);
    for (const folder of recentFolders) {
      this.recentFolders.add(folder);
    }

    return [...recentFolders, ...folders.filter((folder) => !this.recentFolders.has(folder))];
  }
}

export async function selectFolder(params: SelectFolderParams): Promise<null | TFolder> {
  return await new Promise<null | TFolder>((resolve) => {
    const selector = new FolderSelectorModal({ ...params, resolve });
    selector.open();
  });
}
