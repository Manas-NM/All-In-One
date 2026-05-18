import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../utils/constants';
import {
  Note,
  NoteCreateInput,
  Expense,
  ExpenseCategory,
  MonthlyTotal,
  CategoryTotal,
  Subject,
  Task,
  TaskPriority,
  Habit,
  HabitLog,
  HabitFrequency,
  FlashcardDeck,
  Flashcard,
  FlashcardReview,
} from '../types';
import { CATEGORY_CONFIG } from '../utils/constants';

let db: SQLite.SQLiteDatabase | null = null;

// ─── Initialize Database ────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT NOT NULL DEFAULT '[]',
      textContent TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6C5CE7',
      isFavorite INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Run migrations for Phase 2 & 3
  await runMigrations();
}

async function runMigrations(): Promise<void> {
  const database = getDb();

  // ── Subjects table ──────────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6C5CE7',
      icon TEXT NOT NULL DEFAULT 'book',
      createdAt INTEGER NOT NULL
    );
  `);

  // ── Tasks table ──────────────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      dueDate INTEGER,
      priority TEXT NOT NULL DEFAULT 'medium',
      completed INTEGER NOT NULL DEFAULT 0,
      noteId TEXT,
      subjectId TEXT,
      createdAt INTEGER NOT NULL
    );
  `);

  // ── Habits table (Phase 3) ──────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'daily',
      color TEXT NOT NULL DEFAULT '#6C5CE7',
      icon TEXT NOT NULL DEFAULT 'fitness',
      targetDays INTEGER NOT NULL DEFAULT 7,
      createdAt INTEGER NOT NULL
    );
  `);

  // ── HabitLogs table (Phase 3) ───────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habitId TEXT NOT NULL,
      completedDate INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  // ── FlashcardDecks table (Phase 3) ──────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      subjectId TEXT,
      noteId TEXT,
      createdAt INTEGER NOT NULL
    );
  `);

  // ── Flashcards table (Phase 3) ──────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY NOT NULL,
      deckId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 1,
      nextReviewDate INTEGER NOT NULL,
      reviewCount INTEGER NOT NULL DEFAULT 0,
      easeFactor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (deckId) REFERENCES flashcard_decks(id) ON DELETE CASCADE
    );
  `);

  // ── FlashcardReviews table (Phase 3) ────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS flashcard_reviews (
      id TEXT PRIMARY KEY NOT NULL,
      flashcardId TEXT NOT NULL,
      quality INTEGER NOT NULL,
      reviewedAt INTEGER NOT NULL,
      FOREIGN KEY (flashcardId) REFERENCES flashcards(id) ON DELETE CASCADE
    );
  `);

  // ── Add columns to notes table ──────────────────────────────
  try { await database.execAsync(`ALTER TABLE notes ADD COLUMN subject_id TEXT;`); } catch { /* exists */ }
  try { await database.execAsync(`ALTER TABLE notes ADD COLUMN ai_summary TEXT;`); } catch { /* exists */ }
  try { await database.execAsync(`ALTER TABLE notes ADD COLUMN ocr_text TEXT;`); } catch { /* exists */ }

  // ── Seed default subjects on first launch ───────────────────
  const subjectCount = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM subjects'
  );
  if (subjectCount && subjectCount.cnt === 0) {
    const now = Date.now();
    await database.execAsync(`
      INSERT INTO subjects (id, name, color, icon, createdAt) VALUES
        ('${generateId()}_gen', 'General', '#6C5CE7', 'book', ${now}),
        ('${generateId()}_per', 'Personal', '#FD79A8', 'color-palette', ${now + 1}),
        ('${generateId()}_wrk', 'Work', '#74B9FF', 'flask', ${now + 2});
    `);
  }
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ─── Notes CRUD ─────────────────────────────────────────────────

export async function getAllNotes(): Promise<Note[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM notes ORDER BY updatedAt DESC'
  );
  return rows.map(mapNoteRow);
}

export async function getNotesBySubject(subjectId: string): Promise<Note[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM notes WHERE subject_id = ? ORDER BY updatedAt DESC',
    [subjectId]
  );
  return rows.map(mapNoteRow);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const database = getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM notes WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return mapNoteRow(row);
}

function mapNoteRow(row: any): Note {
  return {
    ...row,
    isFavorite: Boolean(row.isFavorite),
    subjectId: row.subject_id ?? null,
    aiSummary: row.ai_summary ?? null,
    ocrText: row.ocr_text ?? null,
  };
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const database = getDb();
  const now = new Date().toISOString();
  const id = generateId();

  await database.runAsync(
    `INSERT INTO notes (id, title, content, textContent, createdAt, updatedAt, color, isFavorite, subject_id, ai_summary, ocr_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.content,
      input.textContent,
      now,
      now,
      input.color,
      input.isFavorite ? 1 : 0,
      input.subjectId ?? null,
      input.aiSummary ?? null,
      input.ocrText ?? null,
    ]
  );

  return {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const now = new Date().toISOString();
  const fields: string[] = ['updatedAt = ?'];
  const values: any[] = [now];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
  if (updates.textContent !== undefined) { fields.push('textContent = ?'); values.push(updates.textContent); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.isFavorite !== undefined) { fields.push('isFavorite = ?'); values.push(updates.isFavorite ? 1 : 0); }
  if (updates.subjectId !== undefined) { fields.push('subject_id = ?'); values.push(updates.subjectId); }
  if (updates.aiSummary !== undefined) { fields.push('ai_summary = ?'); values.push(updates.aiSummary); }
  if (updates.ocrText !== undefined) { fields.push('ocr_text = ?'); values.push(updates.ocrText); }

  values.push(id);
  await database.runAsync(
    `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteNote(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const database = getDb();
  const pattern = `%${query}%`;
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM notes WHERE title LIKE ? OR textContent LIKE ? OR ocr_text LIKE ? ORDER BY updatedAt DESC`,
    [pattern, pattern, pattern]
  );
  return rows.map(mapNoteRow);
}

// ─── Subjects CRUD ──────────────────────────────────────────────

export async function getAllSubjects(): Promise<Subject[]> {
  const database = getDb();
  return database.getAllAsync<Subject>(
    'SELECT * FROM subjects ORDER BY createdAt ASC'
  );
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const database = getDb();
  return database.getFirstAsync<Subject>(
    'SELECT * FROM subjects WHERE id = ?',
    [id]
  );
}

export async function createSubject(
  subject: Omit<Subject, 'id' | 'createdAt'>
): Promise<Subject> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO subjects (id, name, color, icon, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [id, subject.name, subject.color, subject.icon, createdAt]
  );

  return { id, ...subject, createdAt };
}

export async function updateSubject(
  id: string,
  updates: Partial<Omit<Subject, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(
    `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteSubject(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE notes SET subject_id = NULL WHERE subject_id = ?', [id]);
  await database.runAsync('UPDATE tasks SET subjectId = NULL WHERE subjectId = ?', [id]);
  await database.runAsync('DELETE FROM subjects WHERE id = ?', [id]);
}

export async function getNotesCountBySubject(subjectId: string): Promise<number> {
  const database = getDb();
  const row = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM notes WHERE subject_id = ?',
    [subjectId]
  );
  return row?.cnt ?? 0;
}

// ─── Tasks CRUD ─────────────────────────────────────────────────

export async function getAllTasks(): Promise<Task[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM tasks ORDER BY completed ASC, dueDate ASC, createdAt DESC'
  );
  return rows.map(mapTaskRow);
}

export async function getTasksByNote(noteId: string): Promise<Task[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM tasks WHERE noteId = ? ORDER BY completed ASC, createdAt DESC',
    [noteId]
  );
  return rows.map(mapTaskRow);
}

export async function getTasksBySubject(subjectId: string): Promise<Task[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM tasks WHERE subjectId = ? ORDER BY completed ASC, createdAt DESC',
    [subjectId]
  );
  return rows.map(mapTaskRow);
}

function mapTaskRow(row: any): Task {
  return {
    ...row,
    completed: Boolean(row.completed),
    dueDate: row.dueDate ?? null,
    noteId: row.noteId ?? null,
    subjectId: row.subjectId ?? null,
  };
}

export async function createTask(
  task: Omit<Task, 'id' | 'createdAt'>
): Promise<Task> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO tasks (id, title, description, dueDate, priority, completed, noteId, subjectId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, task.title, task.description, task.dueDate ?? null, task.priority, task.completed ? 1 : 0, task.noteId ?? null, task.subjectId ?? null, createdAt]
  );

  return { id, ...task, createdAt };
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.dueDate !== undefined) { fields.push('dueDate = ?'); values.push(updates.dueDate); }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
  if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed ? 1 : 0); }
  if (updates.noteId !== undefined) { fields.push('noteId = ?'); values.push(updates.noteId); }
  if (updates.subjectId !== undefined) { fields.push('subjectId = ?'); values.push(updates.subjectId); }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTask(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function toggleTaskComplete(id: string): Promise<boolean> {
  const database = getDb();
  const row = await database.getFirstAsync<{ completed: number }>(
    'SELECT completed FROM tasks WHERE id = ?',
    [id]
  );
  if (!row) return false;
  const newVal = row.completed ? 0 : 1;
  await database.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [newVal, id]);
  return Boolean(newVal);
}

// ─── Habits CRUD ────────────────────────────────────────────────

export async function getAllHabits(): Promise<Habit[]> {
  const database = getDb();
  return database.getAllAsync<Habit>(
    'SELECT * FROM habits ORDER BY createdAt ASC'
  );
}

export async function createHabit(
  habit: Omit<Habit, 'id' | 'createdAt'>
): Promise<Habit> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO habits (id, name, description, frequency, color, icon, targetDays, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, habit.name, habit.description, habit.frequency, habit.color, habit.icon, habit.targetDays, createdAt]
  );

  return { id, ...habit, createdAt };
}

export async function updateHabit(
  id: string,
  updates: Partial<Omit<Habit, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.targetDays !== undefined) { fields.push('targetDays = ?'); values.push(updates.targetDays); }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteHabit(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM habit_logs WHERE habitId = ?', [id]);
  await database.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function getHabitLogs(habitId: string): Promise<HabitLog[]> {
  const database = getDb();
  return database.getAllAsync<HabitLog>(
    'SELECT * FROM habit_logs WHERE habitId = ? ORDER BY completedDate DESC',
    [habitId]
  );
}

export async function getAllHabitLogs(): Promise<HabitLog[]> {
  const database = getDb();
  return database.getAllAsync<HabitLog>(
    'SELECT * FROM habit_logs ORDER BY completedDate DESC'
  );
}

export async function checkInHabit(habitId: string, date: number): Promise<HabitLog> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO habit_logs (id, habitId, completedDate, createdAt) VALUES (?, ?, ?, ?)`,
    [id, habitId, date, createdAt]
  );

  return { id, habitId, completedDate: date, createdAt };
}

export async function uncheckHabit(habitId: string, date: number): Promise<void> {
  const database = getDb();
  // Remove log for this habit on this specific day
  const dayStart = date;
  const dayEnd = date + 86400000; // +1 day in ms
  await database.runAsync(
    'DELETE FROM habit_logs WHERE habitId = ? AND completedDate >= ? AND completedDate < ?',
    [habitId, dayStart, dayEnd]
  );
}

// ─── FlashcardDecks CRUD ────────────────────────────────────────

export async function getAllDecks(): Promise<FlashcardDeck[]> {
  const database = getDb();
  return database.getAllAsync<FlashcardDeck>(
    'SELECT * FROM flashcard_decks ORDER BY createdAt DESC'
  );
}

export async function getDeckById(id: string): Promise<FlashcardDeck | null> {
  const database = getDb();
  return database.getFirstAsync<FlashcardDeck>(
    'SELECT * FROM flashcard_decks WHERE id = ?',
    [id]
  );
}

export async function createDeck(
  deck: Omit<FlashcardDeck, 'id' | 'createdAt'>
): Promise<FlashcardDeck> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO flashcard_decks (id, name, description, subjectId, noteId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, deck.name, deck.description, deck.subjectId ?? null, deck.noteId ?? null, createdAt]
  );

  return { id, ...deck, createdAt };
}

export async function updateDeck(
  id: string,
  updates: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.subjectId !== undefined) { fields.push('subjectId = ?'); values.push(updates.subjectId); }
  if (updates.noteId !== undefined) { fields.push('noteId = ?'); values.push(updates.noteId); }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(`UPDATE flashcard_decks SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteDeck(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM flashcard_reviews WHERE flashcardId IN (SELECT id FROM flashcards WHERE deckId = ?)', [id]);
  await database.runAsync('DELETE FROM flashcards WHERE deckId = ?', [id]);
  await database.runAsync('DELETE FROM flashcard_decks WHERE id = ?', [id]);
}

// ─── Flashcards CRUD ────────────────────────────────────────────

export async function getCardsByDeck(deckId: string): Promise<Flashcard[]> {
  const database = getDb();
  return database.getAllAsync<Flashcard>(
    'SELECT * FROM flashcards WHERE deckId = ? ORDER BY createdAt ASC',
    [deckId]
  );
}

export async function getDueCardsByDeck(deckId: string): Promise<Flashcard[]> {
  const database = getDb();
  const now = Date.now();
  return database.getAllAsync<Flashcard>(
    'SELECT * FROM flashcards WHERE deckId = ? AND nextReviewDate <= ? ORDER BY nextReviewDate ASC',
    [deckId, now]
  );
}

export async function getCardCountByDeck(deckId: string): Promise<number> {
  const database = getDb();
  const row = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM flashcards WHERE deckId = ?',
    [deckId]
  );
  return row?.cnt ?? 0;
}

export async function getDueCardCountByDeck(deckId: string): Promise<number> {
  const database = getDb();
  const now = Date.now();
  const row = await database.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM flashcards WHERE deckId = ? AND nextReviewDate <= ?',
    [deckId, now]
  );
  return row?.cnt ?? 0;
}

export async function createCard(
  card: Omit<Flashcard, 'id' | 'createdAt'>
): Promise<Flashcard> {
  const database = getDb();
  const id = generateId();
  const createdAt = Date.now();

  await database.runAsync(
    `INSERT INTO flashcards (id, deckId, front, back, difficulty, nextReviewDate, reviewCount, easeFactor, interval, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, card.deckId, card.front, card.back, card.difficulty, card.nextReviewDate, card.reviewCount, card.easeFactor, card.interval, createdAt]
  );

  return { id, ...card, createdAt };
}

export async function updateCard(
  id: string,
  updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>
): Promise<void> {
  const database = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.front !== undefined) { fields.push('front = ?'); values.push(updates.front); }
  if (updates.back !== undefined) { fields.push('back = ?'); values.push(updates.back); }
  if (updates.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(updates.difficulty); }
  if (updates.nextReviewDate !== undefined) { fields.push('nextReviewDate = ?'); values.push(updates.nextReviewDate); }
  if (updates.reviewCount !== undefined) { fields.push('reviewCount = ?'); values.push(updates.reviewCount); }
  if (updates.easeFactor !== undefined) { fields.push('easeFactor = ?'); values.push(updates.easeFactor); }
  if (updates.interval !== undefined) { fields.push('interval = ?'); values.push(updates.interval); }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(`UPDATE flashcards SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteCard(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM flashcard_reviews WHERE flashcardId = ?', [id]);
  await database.runAsync('DELETE FROM flashcards WHERE id = ?', [id]);
}

export async function createReview(
  review: Omit<FlashcardReview, 'id'>
): Promise<FlashcardReview> {
  const database = getDb();
  const id = generateId();

  await database.runAsync(
    `INSERT INTO flashcard_reviews (id, flashcardId, quality, reviewedAt) VALUES (?, ?, ?, ?)`,
    [id, review.flashcardId, review.quality, review.reviewedAt]
  );

  return { id, ...review };
}

// ─── Expenses CRUD ──────────────────────────────────────────────

export async function getAllExpenses(): Promise<Expense[]> {
  const database = getDb();
  return database.getAllAsync<Expense>(
    'SELECT * FROM expenses ORDER BY date DESC, createdAt DESC'
  );
}

export async function getExpensesByMonth(yearMonth: string): Promise<Expense[]> {
  const database = getDb();
  return database.getAllAsync<Expense>(
    "SELECT * FROM expenses WHERE substr(date, 1, 7) = ? ORDER BY date DESC",
    [yearMonth]
  );
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const database = getDb();
  const id = generateId();
  const createdAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO expenses (id, amount, category, description, date, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, expense.amount, expense.category, expense.description, expense.date, createdAt]
  );

  return { id, ...expense, createdAt };
}

export async function deleteExpense(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getMonthlyTotals(months: number = 6): Promise<MonthlyTotal[]> {
  const database = getDb();
  return database.getAllAsync<MonthlyTotal>(
    `SELECT substr(date, 1, 7) as month, SUM(amount) as total
     FROM expenses
     GROUP BY month
     ORDER BY month DESC
     LIMIT ?`,
    [months]
  );
}

export async function getCategoryTotals(yearMonth?: string): Promise<CategoryTotal[]> {
  const database = getDb();
  let query: string;
  let params: any[];

  if (yearMonth) {
    query = `SELECT category, SUM(amount) as total FROM expenses WHERE substr(date, 1, 7) = ? GROUP BY category ORDER BY total DESC`;
    params = [yearMonth];
  } else {
    query = `SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC`;
    params = [];
  }

  const rows = await database.getAllAsync<{ category: ExpenseCategory; total: number }>(query, params);
  return rows.map((row) => ({
    ...row,
    color: CATEGORY_CONFIG[row.category]?.color ?? '#ADB5BD',
  }));
}

// ─── Settings ───────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ─── Helpers ────────────────────────────────────────────────────

export function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}
