import { create } from 'zustand';
import { Task } from '../types';
import * as db from '../services/database';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  getTasksByNote: (noteId: string) => Task[];
  getTasksBySubject: (subjectId: string) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await db.getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (input) => {
    const task = await db.createTask(input);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, updates) => {
    await db.updateTask(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTask: async (id) => {
    await db.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  toggleTaskComplete: async (id) => {
    const newCompleted = await db.toggleTaskComplete(id);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: newCompleted } : t
      ),
    }));
  },

  getTasksByNote: (noteId) => {
    return get().tasks.filter((t) => t.noteId === noteId);
  },

  getTasksBySubject: (subjectId) => {
    return get().tasks.filter((t) => t.subjectId === subjectId);
  },
}));
