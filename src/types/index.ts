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
}

export type NoteCreateInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

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
  Finance: undefined;
  Settings: undefined;
};

export type NotesStackParamList = {
  NotesList: undefined;
  NoteEditor: { noteId?: string };
};
