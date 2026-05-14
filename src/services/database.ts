import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../utils/constants';
import { Note, NoteCreateInput, Expense, ExpenseCategory, MonthlyTotal, CategoryTotal } from '../types';
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
  return rows.map((row) => ({
    ...row,
    isFavorite: Boolean(row.isFavorite),
  }));
}

export async function getNoteById(id: string): Promise<Note | null> {
  const database = getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM notes WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return { ...row, isFavorite: Boolean(row.isFavorite) };
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const database = getDb();
  const now = new Date().toISOString();
  const id = generateId();

  await database.runAsync(
    `INSERT INTO notes (id, title, content, textContent, createdAt, updatedAt, color, isFavorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.content, input.textContent, now, now, input.color, input.isFavorite ? 1 : 0]
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

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.textContent !== undefined) {
    fields.push('textContent = ?');
    values.push(updates.textContent);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }

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
    query = `SELECT category, SUM(amount) as total
             FROM expenses
             WHERE substr(date, 1, 7) = ?
             GROUP BY category
             ORDER BY total DESC`;
    params = [yearMonth];
  } else {
    query = `SELECT category, SUM(amount) as total
             FROM expenses
             GROUP BY category
             ORDER BY total DESC`;
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

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}
