import { create } from 'zustand';
import { Habit, HabitLog, HabitStats } from '../types';
import * as db from '../services/database';

// ─── Helpers ────────────────────────────────────────────────────

function getStartOfDay(timestamp?: number): number {
  const d = timestamp ? new Date(timestamp) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfWeek(timestamp?: number): number {
  const d = timestamp ? new Date(timestamp) : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfMonth(timestamp?: number): number {
  const d = timestamp ? new Date(timestamp) : new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const ONE_DAY = 86400000;

// ─── Store ──────────────────────────────────────────────────────

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  isLoading: boolean;

  loadHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkInHabit: (habitId: string) => Promise<void>;
  uncheckHabit: (habitId: string) => Promise<void>;
  isCheckedInToday: (habitId: string) => boolean;
  getHabitStats: (habitId: string) => HabitStats;
  getCurrentStreak: (habitId: string) => number;
  getBestStreak: (habitId: string) => number;
  getWeekCompletions: (habitId: string) => number;
  getHabitLogsForMonth: (habitId: string, year: number, month: number) => number[];
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  logs: [],
  isLoading: false,

  loadHabits: async () => {
    set({ isLoading: true });
    try {
      const [habits, logs] = await Promise.all([
        db.getAllHabits(),
        db.getAllHabitLogs(),
      ]);
      set({ habits, logs, isLoading: false });
    } catch (error) {
      console.error('Failed to load habits:', error);
      set({ isLoading: false });
    }
  },

  addHabit: async (input) => {
    const habit = await db.createHabit(input);
    set((state) => ({ habits: [...state.habits, habit] }));
    return habit;
  },

  updateHabit: async (id, updates) => {
    await db.updateHabit(id, updates);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  },

  deleteHabit: async (id) => {
    await db.deleteHabit(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      logs: state.logs.filter((l) => l.habitId !== id),
    }));
  },

  checkInHabit: async (habitId) => {
    const today = getStartOfDay();
    // Check if already checked in today
    const existing = get().logs.find(
      (l) => l.habitId === habitId && l.completedDate >= today && l.completedDate < today + ONE_DAY
    );
    if (existing) return;

    const log = await db.checkInHabit(habitId, today);
    set((state) => ({ logs: [log, ...state.logs] }));
  },

  uncheckHabit: async (habitId) => {
    const today = getStartOfDay();
    await db.uncheckHabit(habitId, today);
    set((state) => ({
      logs: state.logs.filter(
        (l) => !(l.habitId === habitId && l.completedDate >= today && l.completedDate < today + ONE_DAY)
      ),
    }));
  },

  isCheckedInToday: (habitId) => {
    const today = getStartOfDay();
    return get().logs.some(
      (l) => l.habitId === habitId && l.completedDate >= today && l.completedDate < today + ONE_DAY
    );
  },

  getCurrentStreak: (habitId) => {
    const habitLogs = get()
      .logs.filter((l) => l.habitId === habitId)
      .map((l) => getStartOfDay(l.completedDate))
      .sort((a, b) => b - a); // desc

    if (habitLogs.length === 0) return 0;

    const uniqueDays = [...new Set(habitLogs)];
    let streak = 0;
    let checkDate = getStartOfDay();

    // If not checked in today, start from yesterday
    if (uniqueDays[0] !== checkDate) {
      checkDate -= ONE_DAY;
    }

    for (let i = 0; i < uniqueDays.length; i++) {
      if (uniqueDays[i] === checkDate) {
        streak++;
        checkDate -= ONE_DAY;
      } else if (uniqueDays[i] < checkDate) {
        break;
      }
    }

    return streak;
  },

  getBestStreak: (habitId) => {
    const habitLogs = get()
      .logs.filter((l) => l.habitId === habitId)
      .map((l) => getStartOfDay(l.completedDate));

    if (habitLogs.length === 0) return 0;

    const uniqueDays = [...new Set(habitLogs)].sort((a, b) => a - b);
    let best = 1;
    let current = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      if (uniqueDays[i] - uniqueDays[i - 1] === ONE_DAY) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }

    return best;
  },

  getWeekCompletions: (habitId) => {
    const weekStart = getStartOfWeek();
    return get().logs.filter(
      (l) => l.habitId === habitId && l.completedDate >= weekStart
    ).length;
  },

  getHabitStats: (habitId) => {
    const logs = get().logs.filter((l) => l.habitId === habitId);
    const monthStart = getStartOfMonth();
    const weekStart = getStartOfWeek();

    return {
      totalCompletions: logs.length,
      currentStreak: get().getCurrentStreak(habitId),
      bestStreak: get().getBestStreak(habitId),
      thisWeekCompletions: logs.filter((l) => l.completedDate >= weekStart).length,
      thisMonthCompletions: logs.filter((l) => l.completedDate >= monthStart).length,
    };
  },

  getHabitLogsForMonth: (habitId, year, month) => {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    return get()
      .logs.filter(
        (l) => l.habitId === habitId && l.completedDate >= start && l.completedDate <= end
      )
      .map((l) => new Date(l.completedDate).getDate());
  },
}));
