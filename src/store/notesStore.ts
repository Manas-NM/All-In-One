import { create } from 'zustand';
import { Note, NoteCreateInput } from '../types';
import * as db from '../services/database';

interface NotesState {
  notes: Note[];
  isLoading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: (input: NoteCreateInput) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await db.getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ isLoading: false });
    }
  },

  createNote: async (input: NoteCreateInput) => {
    const note = await db.createNote(input);
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id, updates) => {
    await db.updateNote(id, updates);
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      ),
    }));
  },

  deleteNote: async (id) => {
    await db.deleteNote(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const newFav = !note.isFavorite;
    await db.updateNote(id, { isFavorite: newFav });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, isFavorite: newFav } : n
      ),
    }));
  },
}));
