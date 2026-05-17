import { create } from 'zustand';
import { Subject } from '../types';
import * as db from '../services/database';

interface SubjectsState {
  subjects: Subject[];
  isLoading: boolean;

  loadSubjects: () => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<Subject>;
  updateSubject: (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  getSubjectById: (id: string) => Subject | undefined;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  isLoading: false,

  loadSubjects: async () => {
    set({ isLoading: true });
    try {
      const subjects = await db.getAllSubjects();
      set({ subjects, isLoading: false });
    } catch (error) {
      console.error('Failed to load subjects:', error);
      set({ isLoading: false });
    }
  },

  addSubject: async (input) => {
    const subject = await db.createSubject(input);
    set((state) => ({ subjects: [...state.subjects, subject] }));
    return subject;
  },

  updateSubject: async (id, updates) => {
    await db.updateSubject(id, updates);
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },

  deleteSubject: async (id) => {
    await db.deleteSubject(id);
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
  },

  getSubjectById: (id) => {
    return get().subjects.find((s) => s.id === id);
  },
}));
