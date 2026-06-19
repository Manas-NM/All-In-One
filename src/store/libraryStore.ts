import { create } from 'zustand';
import { LibraryFolder, Notebook } from '../types';
import * as db from '../services/database';

interface LibraryState {
  folders: LibraryFolder[];
  notebooks: Notebook[];
  currentFolderId: string | null;
  searchQuery: string;
  isLoading: boolean;

  loadLibrary: () => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;

  createFolder: (input: Omit<LibraryFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LibraryFolder>;
  updateFolder: (id: string, updates: Partial<Omit<LibraryFolder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createNotebook: (input: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Notebook>;
  updateNotebook: (id: string, updates: Partial<Omit<Notebook, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  folders: [],
  notebooks: [],
  currentFolderId: null,
  searchQuery: '',
  isLoading: false,

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const [folders, notebooks] = await Promise.all([
        db.getAllFolders(),
        db.getAllNotebooks(),
      ]);
      set({ folders, notebooks, isLoading: false });
    } catch (error) {
      console.error('Failed to load library', error);
      set({ isLoading: false });
    }
  },

  setCurrentFolder: (folderId) => set({ currentFolderId: folderId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  createFolder: async (input) => {
    const folder = await db.createFolder(input);
    set((state) => ({ folders: [folder, ...state.folders] }));
    return folder;
  },

  updateFolder: async (id, updates) => {
    await db.updateFolder(id, updates);
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates, updatedAt: Date.now() } : folder
      ),
    }));
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      notebooks: state.notebooks.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
      currentFolderId: state.currentFolderId === id ? null : state.currentFolderId,
    }));
  },

  createNotebook: async (input) => {
    const notebook = await db.createNotebook(input);
    set((state) => ({ notebooks: [notebook, ...state.notebooks] }));
    return notebook;
  },

  updateNotebook: async (id, updates) => {
    await db.updateNotebook(id, updates);
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      ),
    }));
  },

  deleteNotebook: async (id) => {
    await db.deleteNotebook(id);
    set((state) => ({ notebooks: state.notebooks.filter((n) => n.id !== id) }));
  },
}));
