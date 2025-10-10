import type {
  App,
  FuzzyMatch,
  SearchResult,
  TFolder
} from 'obsidian';

import {
  FuzzySuggestModal,
  prepareFuzzySearch,
  sortSearchResults
} from 'obsidian';
import { invokeAsyncSafely } from 'obsidian-dev-utils/Async';

class FolderSelectorModal extends FuzzySuggestModal<null | TFolder> {
  private isSelected = false;

  public constructor(app: App, private readonly resolve: (folder: null | TFolder) => void, private initialQuery: string) {
    super(app);
  }

  public override getItems(): TFolder[] {
    return this.app.vault.getAllFolders(true);
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
      let allPartsMatch = true;

      for (const searchFn of searchFunctions) {
        const match = searchFn(folder.path);

        if (match) {
          partMatches.push(match);
        } else {
          allPartsMatch = false;
          break;
        }
      }

      if (allPartsMatch) {
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
    }

    sortSearchResults(results);
    if (results[0]?.item?.path !== query) {
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
    this.inputEl.value = this.initialQuery;
    this.updateSuggestions();
  }

  public override renderSuggestion(item: FuzzyMatch<null | TFolder>, el: HTMLElement): void {
    super.renderSuggestion(item, el);
    if (item.item) {
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

  public override selectSuggestion(value: FuzzyMatch<null | TFolder>, evt: KeyboardEvent | MouseEvent): void {
    this.isSelected = true;
    super.selectSuggestion(value, evt);
  }
}

export async function selectFolder(app: App, initialQuery: string): Promise<null | TFolder> {
  return await new Promise<null | TFolder>((resolve) => {
    const selector = new FolderSelectorModal(app, resolve, initialQuery);
    selector.open();
  });
}
