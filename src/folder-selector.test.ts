import type {
  App,
  FuzzyMatch,
  TFolder
} from 'obsidian';

import { FuzzySuggestModal } from 'obsidian';
import { castTo } from 'obsidian-dev-utils/object-utils';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

/**
 * `FolderSelectorModal` extends the REAL `FuzzySuggestModal` from
 * `obsidian-test-mocks`. The test-mocks shell intentionally leaves a few
 * Obsidian-internal members unimplemented (they are Obsidian's own, not
 * test-mocks logic): `getSuggestions` / `renderSuggestion` are declared
 * `abstract` on `SuggestModal` (no `super` body), and `chooser` /
 * `updateSuggestions` are not modeled at all. The source's `super.getSuggestions`,
 * `super.renderSuggestion`, `this.chooser` and `this.updateSuggestions` calls
 * therefore need those members supplemented. We do this by stubbing their
 * RETURN VALUE / BEHAVIOR on the real `FuzzySuggestModal.prototype` (the
 * sanctioned return-value stub), NOT by re-creating any test-mocks class body.
 */

const mockSearchFn = vi.fn();
const mockSortSearchResults = vi.fn();
const mockInvokeAsyncSafely = vi.fn();

/* eslint-disable obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting. */
const mockFolders: TFolder[] = [
  { path: 'notes' } as TFolder,
  { path: 'notes/daily' } as TFolder,
  { path: 'attachments' } as TFolder
];
/* eslint-enable obsidianmd/no-tfile-tfolder-cast -- end of mock data block. */

interface ChooserStub {
  setSuggestions: ReturnType<typeof vi.fn>;
}

interface CreateModalResult {
  readonly instance: FolderSelectorModalTestable;
  readonly promise: Promise<null | TFolder>;
}

interface FolderSelectorModalTestable {
  app: App;
  chooser: ChooserStub;
  getItems(): TFolder[];
  getItemText(item: null | TFolder): string;
  getSuggestions(query: string): FuzzyMatch<null | TFolder>[];
  inputEl: HTMLInputElement;
  onChooseItem(item: null | TFolder): void;
  onClose(): void;
  onNoSuggestion(): void;
  onOpen(): void;
  renderSuggestion(item: FuzzyMatch<null | TFolder>, el: HTMLElement): void;
  selectSuggestion(value: FuzzyMatch<null | TFolder>, evt: KeyboardEvent | MouseEvent): void;
  setPlaceholder(placeholder: string): void;
  updateSuggestions: ReturnType<typeof vi.fn>;
}

vi.mock('obsidian', async (importOriginal) => ({
  ...await importOriginal<typeof import('obsidian')>(),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- mock factory return type is inferred.
  prepareFuzzySearch: () => mockSearchFn,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  sortSearchResults: (...args: unknown[]): void => mockSortSearchResults(...args)
}));

vi.mock('obsidian-dev-utils/async', async (importOriginal) => ({
  ...await importOriginal<typeof import('obsidian-dev-utils/async')>(),
  /*
   * Sanctioned borderline exception: stub the fire-and-forget helper so the async
   * create-folder flow becomes awaitable / synchronously drivable in tests.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  invokeAsyncSafely: (...args: unknown[]): void => mockInvokeAsyncSafely(...args)
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { selectFolder } from './folder-selector.ts';

const fuzzySuggestModalProto = castTo<FolderSelectorModalTestable>(FuzzySuggestModal.prototype);

describe('selectFolder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockInvokeAsyncSafely.mockReset();
    mockSearchFn.mockReset();
    mockSortSearchResults.mockReset();

    /*
     * Supplement the Obsidian-internal members that the test-mocks shell leaves abstract /
     * not modeled. `updateSuggestions` is the capture hook: the source calls
     * `this.updateSuggestions()` at the end of `onOpen`, which runs synchronously inside
     * `selectFolder` via the real `Modal.open()`, so its recorded `this` is the modal instance.
     */
    fuzzySuggestModalProto.updateSuggestions = vi.fn();
    fuzzySuggestModalProto.chooser = { setSuggestions: vi.fn() };
    fuzzySuggestModalProto.getSuggestions = vi.fn().mockReturnValue([]);
    fuzzySuggestModalProto.renderSuggestion = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('selectFolder', () => {
    it('should return a promise', () => {
      const { promise } = createModal('/');

      expect(promise).toBeInstanceOf(Promise);
      // Let the real auto-close resolve to prevent hanging.
      vi.runOnlyPendingTimers();
    });

    it('should resolve with null when modal closes without selection', async () => {
      const { instance, promise } = createModal('/');

      instance.onClose();

      const result = await promise;
      expect(result).toBeNull();
    });

    it('should not resolve with null when modal closes after selection', async () => {
      const { instance, promise } = createModal('/');

      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const folder = { path: 'notes' } as TFolder;
      instance.onChooseItem(folder);
      instance.selectSuggestion({ item: folder, match: { matches: [], score: 0 } }, castTo<MouseEvent>({}));
      instance.onClose();

      const result = await promise;
      expect(result).toBe(folder);
    });

    it('should resolve with chosen folder when item is selected', async () => {
      const { instance, promise } = createModal('/');

      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const folder = { path: 'notes' } as TFolder;
      instance.onChooseItem(folder);

      const result = await promise;
      expect(result).toBe(folder);
    });

    it('should call invokeAsyncSafely when null item is chosen (create new folder)', () => {
      const { instance } = createModal('/');

      instance.onChooseItem(null);

      expect(mockInvokeAsyncSafely).toHaveBeenCalled();
      vi.runOnlyPendingTimers();
    });

    it('should resolve with created folder when vault.createFolder succeeds', async () => {
      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const createdFolder = { path: 'new-folder' } as TFolder;
      mockInvokeAsyncSafely.mockImplementation((fn: () => Promise<void>): void => {
        fn().catch(() => {
          /* Intentionally swallowed for test */
        });
      });

      const { instance, promise } = createModal('/');
      instance.inputEl.value = 'new-folder';

      castTo<ReturnType<typeof vi.fn>>(instance.app.vault.createFolder).mockResolvedValue(createdFolder);

      instance.onChooseItem(null);

      const result = await promise;
      expect(result).toBe(createdFolder);
    });

    it('should reopen modal with input value when vault.createFolder fails', async () => {
      mockInvokeAsyncSafely.mockImplementation((fn: () => Promise<void>): void => {
        fn().catch(() => {
          /* Intentionally swallowed for test */
        });
      });

      const { instance } = createModal('/');
      instance.inputEl.value = 'existing-folder';

      castTo<ReturnType<typeof vi.fn>>(instance.app.vault.createFolder).mockRejectedValue(new Error('Folder exists'));

      instance.onChooseItem(null);

      await vi.waitFor(() => {
        expect(instance.inputEl.value).toBe('existing-folder');
      });

      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.getItems', () => {
    it('should return all folders from vault', () => {
      const { instance } = createModal('/');

      const items = instance.getItems();

      expect(items).toBe(mockFolders);
      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.getItemText', () => {
    it('should return folder path for non-null item', () => {
      const { instance } = createModal('/');

      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const text = instance.getItemText({ path: 'my-folder' } as TFolder);

      expect(text).toBe('my-folder');
      vi.runOnlyPendingTimers();
    });

    it('should return empty string for null item', () => {
      const { instance } = createModal('/');

      const text = instance.getItemText(null);

      expect(text).toBe('');
      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.getSuggestions', () => {
    it('should delegate to super for empty query', () => {
      const { instance } = createModal('/');

      const results = instance.getSuggestions('');

      expect(results).toEqual([]);
      expect(fuzzySuggestModalProto.getSuggestions).toHaveBeenCalled();
      vi.runOnlyPendingTimers();
    });

    it('should delegate to super for whitespace-only query', () => {
      const { instance } = createModal('/');

      const results = instance.getSuggestions('   ');

      expect(results).toEqual([]);
      expect(fuzzySuggestModalProto.getSuggestions).toHaveBeenCalled();
      vi.runOnlyPendingTimers();
    });

    it('should return matching folders for non-empty query', () => {
      mockSearchFn.mockReturnValue({ matches: [[0, 5]], score: -1 });

      const { instance } = createModal('/');

      const results = instance.getSuggestions('notes');

      expect(results.length).toBeGreaterThan(0);
      vi.runOnlyPendingTimers();
    });

    it('should sort combined matches from multi-word queries', () => {
      mockSearchFn.mockReturnValue({ matches: [[0, 3]], score: -1 });

      const { instance } = createModal('/');

      const results = instance.getSuggestions('notes daily');

      expect(results.length).toBeGreaterThan(0);
      vi.runOnlyPendingTimers();
    });

    it('should not include unmatched folders', () => {
      mockSearchFn.mockReturnValue(null);

      const { instance } = createModal('/');

      const results = instance.getSuggestions('xyz');

      expect(results).toHaveLength(1);
      expect(results[0]?.item).toBeNull();
      vi.runOnlyPendingTimers();
    });

    it('should prepend null item when first result path does not match query', () => {
      mockSearchFn.mockReturnValue({ matches: [[0, 3]], score: -1 });

      const { instance } = createModal('/');

      const results = instance.getSuggestions('not');

      expect(results[0]?.item).toBeNull();
      vi.runOnlyPendingTimers();
    });

    it('should not prepend null item when first result path matches query exactly', () => {
      mockSearchFn.mockReturnValue({ matches: [[0, 5]], score: -1 });
      mockSortSearchResults.mockImplementation((arr: unknown[]) => arr);

      const { instance } = createModal('/');

      const results = instance.getSuggestions('notes');

      expect(results[0]?.item).not.toBeNull();
      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.selectSuggestion', () => {
    it('should set isSelected to true', () => {
      const { instance, promise } = createModal('/');

      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const mockMatch = { item: { path: 'notes' } as TFolder, match: { matches: [], score: 0 } };
      instance.selectSuggestion(mockMatch, castTo<MouseEvent>({}));

      /*
       * `selectSuggestion` set `isSelected`, so the real auto-close does NOT resolve null.
       * The chosen suggestion's `onChooseSuggestion` resolved it.
       */
      vi.runOnlyPendingTimers();
      return expect(promise).resolves.toEqual({ path: 'notes' });
    });
  });

  describe('FolderSelectorModal.onOpen', () => {
    it('should set placeholder and initial query', () => {
      const { instance } = createModal('my-folder');

      const setPlaceholderSpy = vi.spyOn(instance, 'setPlaceholder');
      instance.onOpen();

      expect(setPlaceholderSpy).toHaveBeenCalledWith('Select a folder...');
      // The real `setPlaceholder` writes through to the input element.
      expect(instance.inputEl.placeholder).toBe('Select a folder...');
      expect(instance.inputEl.value).toBe('my-folder');
      expect(instance.updateSuggestions).toHaveBeenCalled();
      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.onNoSuggestion', () => {
    it('should set empty match in chooser', () => {
      const { instance } = createModal('/');

      instance.onNoSuggestion();

      expect(instance.chooser.setSuggestions).toHaveBeenCalledWith([
        { item: null, match: { matches: [], score: 0 } }
      ]);
      vi.runOnlyPendingTimers();
    });
  });

  describe('FolderSelectorModal.renderSuggestion', () => {
    it('should return early for non-null item', () => {
      const { instance } = createModal('/');

      const el = createDiv();
      const addClassSpy = vi.spyOn(el, 'addClass');

      // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
      const match = { item: { path: 'notes' } as TFolder, match: { matches: [], score: 0 } };
      instance.renderSuggestion(match, el);

      expect(addClassSpy).not.toHaveBeenCalled();
      vi.runOnlyPendingTimers();
    });

    it('should render create UI for null item', () => {
      const { instance } = createModal('/');

      instance.inputEl.value = 'new-folder';

      const el = createDiv();
      const match = { item: null, match: { matches: [], score: 0 } };
      instance.renderSuggestion(match, el);

      expect(el.hasClass('suggestion-item')).toBe(true);
      expect(el.hasClass('mod-complex')).toBe(true);
      expect(el.querySelector('.suggestion-title')?.textContent).toBe('new-folder');
      expect(el.querySelector('.suggestion-action')?.textContent).toBe('Enter to create');
      vi.runOnlyPendingTimers();
    });
  });
});

function createModal(initialQuery: string): CreateModalResult {
  const mockApp = strictProxy<App>({
    vault: strictProxy<App['vault']>({
      createFolder: vi.fn(),
      getAllFolders: vi.fn().mockReturnValue(mockFolders)
    })
  });

  const promise = selectFolder(mockApp, initialQuery);

  /*
   * `selectFolder` synchronously runs the real `Modal.open()`, whose `onOpen` calls
   * `this.updateSuggestions()`. Recover the modal instance from the mock's recorded `this`.
   */
  const contexts = vi.mocked(fuzzySuggestModalProto.updateSuggestions).mock.contexts;
  const instance = castTo<FolderSelectorModalTestable | undefined>(contexts.at(-1));
  if (!instance) {
    throw new Error('Modal was not captured');
  }

  return { instance, promise };
}
