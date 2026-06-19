// ─── Drawing & GoodNotes Canvas Types ─────────────────────────────

export type PenType = 'ballpoint' | 'fountain' | 'pencil';
export type EraserMode = 'stroke' | 'pixel';

export type DrawingTool =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'shape'
  | 'text'
  | 'image';

export interface StrokePoint {
  x: number;
  y: number;
  p?: number; // pressure
  t?: number; // timestamp
}

export interface Stroke {
  id: string;
  // New model
  pageId?: string;
  penType?: PenType;
  baseWidth?: number;
  // Legacy compatibility
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  opacity: number;
  points: StrokePoint[];
}

export type CanvasTemplate = 'lined' | 'grid' | 'dotted' | 'blank' | 'cornell';

export type CanvasObjectType = 'stroke' | 'text' | 'image' | 'shape';

export interface CanvasObject {
  id: string;
  pageId: string;
  type: CanvasObjectType;
  payload: string; // msgpack base64 / json string
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  strokes: Stroke[];
  undoneStrokes: Stroke[];
}

// ─── Subject/Folder Types ─────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface LibraryFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Legacy Note Types (kept for migration compatibility) ─────────

export interface Note {
  id: string;
  title: string;
  content: string; // JSON-serialized canvas strokes
  textContent: string; // plain text notes
  createdAt: string;
  updatedAt: string;
  color: string;
  isFavorite: boolean;
  subjectId: string | null;
  aiSummary: string | null;
  ocrText: string | null;
}

export type NoteCreateInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Notebook Model ───────────────────────────────────────────────

export interface Notebook {
  id: string;
  title: string;
  folderId: string | null;
  coverColor: string;
  coverIcon: string;
  template: CanvasTemplate;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NotebookPage {
  id: string;
  notebookId: string;
  pageNumber: number;
  template: CanvasTemplate;
  title: string;
  thumbnailUri: string | null;
  ocrText: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Task Types ──────────────────────────────────────────────────

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: number | null;
  priority: TaskPriority;
  completed: boolean;
  noteId: string | null; // legacy
  notebookId?: string | null;
  pageId?: string | null;
  subjectId: string | null;
  createdAt: number;
}

// ─── Habit Types ─────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  color: string;
  icon: string;
  targetDays: number;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedDate: number;
  createdAt: number;
}

export interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  bestStreak: number;
  thisWeekCompletions: number;
  thisMonthCompletions: number;
}

// ─── Flashcard Types ─────────────────────────────────────────────

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  subjectId: string | null;
  noteId: string | null; // legacy
  notebookId?: string | null;
  pageId?: string | null;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  difficulty: number;
  nextReviewDate: number;
  reviewCount: number;
  easeFactor: number;
  interval: number;
  createdAt: number;
}

export interface FlashcardReview {
  id: string;
  flashcardId: string;
  quality: number;
  reviewedAt: number;
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
  date: string;
  createdAt: string;
}

export interface MonthlyTotal {
  month: string;
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
  Habits: undefined;
  Finance: undefined;
  Settings: undefined;
};

export type NotesStackParamList = {
  NotesList: { folderId?: string } | undefined;
  NoteEditor: { noteId?: string; notebookId?: string; pageId?: string };
  Subjects: undefined;
  Flashcards: undefined;
  FlashcardDeck: { deckId: string };
  FlashcardStudy: { deckId: string; studyAll?: boolean };
};
