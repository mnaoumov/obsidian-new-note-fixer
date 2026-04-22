import type {
  FuzzyMatch,
  TFolder
} from 'obsidian';

import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

/* eslint-disable obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting. */
const mockFolders: TFolder[] = [
  { path: 'notes' } as TFolder,
  { path: 'notes/daily' } as TFolder,
  { path: 'attachments' } as TFolder
];
/* eslint-enable obsidianmd/no-tfile-tfolder-cast -- end of mock data block. */

const mockSearchFn = vi.fn();
const mockSortSearchResults = vi.fn();
const mockInvokeAsyncSafely = vi.fn();

interface CreateModalResult {
  instance: ModalInstance;
  promise: Promise<null | TFolder>;
}

interface MockAppWithVault {
  vault: MockVault;
}

interface MockChooser {
  setSuggestions: ReturnType<typeof vi.fn>;
}

interface MockInputEl {
  value: string;
}

interface MockVault {
  createFolder: ReturnType<typeof vi.fn>;
}

interface ModalCapture {
  instance: ModalInstance;
  resolve: (folder: null | TFolder) => void;
}

interface ModalInstance {
  app: unknown;
  chooser: MockChooser;
  getItems: () => TFolder[];
  getItemText: (item: null | TFolder) => string;
  getSuggestions: (query: string) => FuzzyMatch<null | TFolder>[];
  inputEl: MockInputEl;
  onChooseItem: (item: null | TFolder) => void;
  onClose: () => void;
  onNoSuggestion: () => void;
  onOpen: () => void;
  renderSuggestion: (item: FuzzyMatch<null | TFolder>, el: HTMLElement) => void;
  selectSuggestion: (value: FuzzyMatch<null | TFolder>, evt: KeyboardEvent | MouseEvent) => void;
  setPlaceholder: ReturnType<typeof vi.fn>;
  updateSuggestions: ReturnType<typeof vi.fn>;
}

let lastCapture: ModalCapture | undefined;

vi.mock('obsidian', () => ({
  FuzzySuggestModal: class MockFuzzySuggestModal {
    public app: unknown;
    public chooser = { setSuggestions: vi.fn() };
    public inputEl = { value: '' };

    public setPlaceholder = vi.fn();

    public updateSuggestions = vi.fn();

    public constructor(app: unknown) {
      this.app = app;
    }

    public getSuggestions(_query: string): unknown[] {
      return [];
    }

    public onClose(): void {
      /* Base no-op */
    }

    public onNoSuggestion(): void {
      /* Base no-op */
    }

    public onOpen(): void {
      /* Base no-op */
    }

    public open(): void {
      lastCapture = {
        // eslint-disable-next-line no-restricted-syntax -- test mock needs double assertion to cast mock to typed interface.
        instance: this as unknown as ModalInstance,
        resolve: (this as Record<string, unknown>)['resolve'] as (folder: null | TFolder) => void
      };
    }

    public renderSuggestion(_item: unknown, _el: unknown): void {
      /* Base no-op */
    }

    public selectSuggestion(_value: unknown, _evt: unknown): void {
      /* Base no-op */
    }
  },
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- mock factory return type is inferred.
  prepareFuzzySearch: () => mockSearchFn,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  sortSearchResults: (...args: unknown[]): void => mockSortSearchResults(...args)
}));

vi.mock('obsidian-dev-utils/async', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- mock factory delegates to hoisted fn.
  invokeAsyncSafely: (...args: unknown[]): void => mockInvokeAsyncSafely(...args)
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { selectFolder } from './folder-selector.ts';

function createModal(initialQuery: string): CreateModalResult {
  const mockApp = {
    vault: {
      createFolder: vi.fn(),
      getAllFolders: vi.fn().mockReturnValue(mockFolders)
    }
  };

  lastCapture = undefined;
  const promise = selectFolder(mockApp as never, initialQuery);

  // SelectFolder synchronously sets lastCapture via the mock open() method
  const capture = lastCapture as ModalCapture | undefined;
  if (!capture) {
    throw new Error('Modal was not captured');
  }

  return { instance: capture.instance, promise };
}

describe('selectFolder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should return a promise', () => {
    const { promise } = createModal('/');

    expect(promise).toBeInstanceOf(Promise);
    // Resolve to prevent hanging
    lastCapture?.resolve(null);
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
    instance.selectSuggestion({ item: folder, match: { matches: [], score: 0 } }, {} as MouseEvent);
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
    // Resolve to prevent hanging
    lastCapture?.resolve(null);
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

    (instance.app as MockAppWithVault).vault.createFolder.mockResolvedValue(createdFolder);

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

    (instance.app as MockAppWithVault).vault.createFolder.mockRejectedValue(new Error('Folder exists'));

    instance.onChooseItem(null);

    await vi.waitFor(() => {
      expect(instance.inputEl.value).toBe('existing-folder');
    });

    // Resolve to prevent hanging
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.getItems', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should return all folders from vault', () => {
    const { instance } = createModal('/');

    const items = instance.getItems();

    expect(items).toBe(mockFolders);
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.getItemText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should return folder path for non-null item', () => {
    const { instance } = createModal('/');

    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
    const text = instance.getItemText({ path: 'my-folder' } as TFolder);

    expect(text).toBe('my-folder');
    lastCapture?.resolve(null);
  });

  it('should return empty string for null item', () => {
    const { instance } = createModal('/');

    const text = instance.getItemText(null);

    expect(text).toBe('');
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.getSuggestions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should delegate to super for empty query', () => {
    const { instance } = createModal('/');

    const results = instance.getSuggestions('');

    expect(results).toEqual([]);
    lastCapture?.resolve(null);
  });

  it('should delegate to super for whitespace-only query', () => {
    const { instance } = createModal('/');

    const results = instance.getSuggestions('   ');

    expect(results).toEqual([]);
    lastCapture?.resolve(null);
  });

  it('should return matching folders for non-empty query', () => {
    mockSearchFn.mockReturnValue({ matches: [[0, 5]], score: -1 });

    const { instance } = createModal('/');

    const results = instance.getSuggestions('notes');

    expect(results.length).toBeGreaterThan(0);
    lastCapture?.resolve(null);
  });

  it('should not include unmatched folders', () => {
    mockSearchFn.mockReturnValue(null);

    const { instance } = createModal('/');

    const results = instance.getSuggestions('xyz');

    expect(results).toHaveLength(1);
    expect(results[0]?.item).toBeNull();
    lastCapture?.resolve(null);
  });

  it('should prepend null item when first result path does not match query', () => {
    mockSearchFn.mockReturnValue({ matches: [[0, 3]], score: -1 });

    const { instance } = createModal('/');

    const results = instance.getSuggestions('not');

    expect(results[0]?.item).toBeNull();
    lastCapture?.resolve(null);
  });

  it('should not prepend null item when first result path matches query exactly', () => {
    mockSearchFn.mockReturnValue({ matches: [[0, 5]], score: -1 });
    mockSortSearchResults.mockImplementation((arr: unknown[]) => arr);

    const { instance } = createModal('/');

    const results = instance.getSuggestions('notes');

    expect(results[0]?.item).not.toBeNull();
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.selectSuggestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should set isSelected to true', () => {
    const { instance } = createModal('/');

    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
    const mockMatch = { item: { path: 'notes' } as TFolder, match: { matches: [], score: 0 } };
    instance.selectSuggestion(mockMatch, {} as MouseEvent);

    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.onOpen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should set placeholder and initial query', () => {
    const { instance } = createModal('my-folder');

    instance.onOpen();

    expect(instance.setPlaceholder).toHaveBeenCalledWith('Select a folder...');
    expect(instance.inputEl.value).toBe('my-folder');
    expect(instance.updateSuggestions).toHaveBeenCalled();
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.onNoSuggestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should set empty match in chooser', () => {
    const { instance } = createModal('/');

    interface MockDiv {
      addClass: ReturnType<typeof vi.fn>;
      createDiv: ReturnType<typeof vi.fn>;
      empty: ReturnType<typeof vi.fn>;
    }

    const mockContentDiv = { createDiv: vi.fn() };
    const mockAuxDiv = { createSpan: vi.fn() };
    const mockDiv: MockDiv = {
      addClass: vi.fn(),
      createDiv: vi.fn().mockReturnValueOnce(mockContentDiv).mockReturnValueOnce(mockAuxDiv),
      empty: vi.fn()
    };

    // eslint-disable-next-line obsidianmd/no-global-this -- node test environment has no window/activeWindow.
    globalThis.createDiv = vi.fn().mockReturnValue(mockDiv);

    instance.onNoSuggestion();

    expect(instance.chooser.setSuggestions).toHaveBeenCalledWith([
      { item: null, match: { matches: [], score: 0 } }
    ]);
    lastCapture?.resolve(null);
  });
});

describe('FolderSelectorModal.renderSuggestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lastCapture = undefined;
  });

  it('should return early for non-null item', () => {
    const { instance } = createModal('/');

    const el = {
      addClass: vi.fn(),
      createDiv: vi.fn(),
      empty: vi.fn()
    };

    // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- test mock data requires casting.
    const match = { item: { path: 'notes' } as TFolder, match: { matches: [], score: 0 } };
    instance.renderSuggestion(match, el as never);

    expect(el.addClass).not.toHaveBeenCalled();
    lastCapture?.resolve(null);
  });

  it('should render create UI for null item', () => {
    const { instance } = createModal('/');

    const mockContentDiv = { createDiv: vi.fn() };
    const mockAuxDiv = { createSpan: vi.fn() };
    const el = {
      addClass: vi.fn(),
      createDiv: vi.fn().mockReturnValueOnce(mockContentDiv).mockReturnValueOnce(mockAuxDiv),
      empty: vi.fn()
    };

    instance.inputEl.value = 'new-folder';

    const match = { item: null, match: { matches: [], score: 0 } };
    instance.renderSuggestion(match, el as never);

    expect(el.addClass).toHaveBeenCalledWith('suggestion-item', 'mod-complex');
    expect(el.empty).toHaveBeenCalled();
    expect(mockContentDiv.createDiv).toHaveBeenCalledWith({ cls: 'suggestion-title', text: 'new-folder' });
    expect(mockAuxDiv.createSpan).toHaveBeenCalledWith({ cls: 'suggestion-action', text: 'Enter to create' });
    lastCapture?.resolve(null);
  });
});
