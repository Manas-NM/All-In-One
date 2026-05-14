import { create } from 'zustand';
import { Expense, ExpenseCategory, MonthlyTotal, CategoryTotal } from '../types';
import * as db from '../services/database';

interface FinanceState {
  expenses: Expense[];
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  selectedMonth: string; // "2026-05"
  isLoading: boolean;

  // Actions
  loadExpenses: () => Promise<void>;
  loadStats: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  getTotalForMonth: () => number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  expenses: [],
  monthlyTotals: [],
  categoryTotals: [],
  selectedMonth: getCurrentMonth(),
  isLoading: false,

  loadExpenses: async () => {
    set({ isLoading: true });
    try {
      const { selectedMonth } = get();
      const expenses = await db.getExpensesByMonth(selectedMonth);
      set({ expenses, isLoading: false });
    } catch (error) {
      console.error('Failed to load expenses:', error);
      set({ isLoading: false });
    }
  },

  loadStats: async () => {
    try {
      const { selectedMonth } = get();
      const [monthlyTotals, categoryTotals] = await Promise.all([
        db.getMonthlyTotals(6),
        db.getCategoryTotals(selectedMonth),
      ]);
      set({ monthlyTotals, categoryTotals });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  addExpense: async (expense) => {
    const created = await db.createExpense(expense);
    const { selectedMonth } = get();
    const expenseMonth = expense.date.substring(0, 7);

    if (expenseMonth === selectedMonth) {
      set((state) => ({ expenses: [created, ...state.expenses] }));
    }
    // Reload stats
    get().loadStats();
  },

  deleteExpense: async (id) => {
    await db.deleteExpense(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    get().loadStats();
  },

  setSelectedMonth: (month) => {
    set({ selectedMonth: month });
  },

  getTotalForMonth: () => {
    return get().expenses.reduce((sum, e) => sum + e.amount, 0);
  },
}));
