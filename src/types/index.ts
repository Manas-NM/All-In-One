// ─── Drawing Types ───────────────────────────────────────────────

export type DrawingTool = 'pen' | 'highlighter' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  width: number;
  opacity: number;
  points: StrokePoint[];
}

export interface CanvasState {
  strokes: Stroke[];
  undoneStrokes: Stroke[];
}

// ─── Subject Types ───────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

// ─── Note Types ─────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string; // JSON-serialized canvas strokes
  textContent: string; // plain text notes
  createdAt: string;
  updatedAt: string;
  color: string; // card accent color
  isFavorite: boolean;
  subjectId: string | null;
  aiSummary: string | null;
}

export type NoteCreateInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Task Types ──────────────────────────────────────────────────

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: number | null; // timestamp
  priority: TaskPriority;
  completed: boolean;
  noteId: string | null;
  subjectId: string | null;
  createdAt: number;
}

// ─── Finance Types ──────────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'books'
  | 'entertainment'
  | 'utilities'
  | 'clothing'
  | 'health'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface MonthlyTotal {
  month: string; // "2026-01"
  total: number;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
  color: string;
}

// ─── Settings Types ─────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  defaultPenColor: string;
  hapticFeedback: boolean;
}

// ─── Navigation Types ───────────────────────────────────────────

export type RootTabParamList = {
  Notes: undefined;
  Tasks: undefined;
  Finance: undefined;
  Settings: undefined;
};

export type NotesStackParamList = {
  NotesList: undefined;
  NoteEditor: { noteId?: string };
  Subjects: undefined;
};
