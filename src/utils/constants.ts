import { ExpenseCategory } from '../types';

// ─── Colors ─────────────────────────────────────────────────────

export const COLORS = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3CB5',

  // Accent
  accent: '#00CEC9',
  accentLight: '#81ECEC',

  // Status
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',

  // Neutrals - Light Theme
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F5',
    text: '#1A1A2E',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    border: '#E9ECEF',
    shadow: 'rgba(0,0,0,0.08)',
  },

  // Neutrals - Dark Theme
  dark: {
    background: '#0A0A1A',
    surface: '#16162A',
    surfaceSecondary: '#1E1E3A',
    text: '#F8F9FA',
    textSecondary: '#ADB5BD',
    textTertiary: '#6C757D',
    border: '#2D2D4A',
    shadow: 'rgba(0,0,0,0.3)',
  },
} as const;

// ─── Drawing Constants ──────────────────────────────────────────

export const PEN_COLORS = ['#1A1A2E', '#E17055', '#6C5CE7'] as const;
export const PEN_COLORS_DARK = ['#F8F9FA', '#E17055', '#6C5CE7'] as const;

export const HIGHLIGHTER_COLOR = 'rgba(253, 203, 110, 0.4)';

export const TOOL_SIZES = {
  pen: 2.5,
  highlighter: 20,
  eraser: 24,
} as const;

// ─── Note Card Colors ───────────────────────────────────────────

export const NOTE_CARD_COLORS = [
  '#6C5CE7',
  '#00CEC9',
  '#E17055',
  '#00B894',
  '#FDCB6E',
  '#FD79A8',
  '#74B9FF',
  '#A29BFE',
] as const;

// ─── Expense Category Config ────────────────────────────────────

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string }
> = {
  food: { label: 'Food & Dining', icon: 'restaurant', color: '#E17055' },
  transport: { label: 'Transport', icon: 'car', color: '#74B9FF' },
  books: { label: 'Books & Supplies', icon: 'book', color: '#6C5CE7' },
  entertainment: {
    label: 'Entertainment',
    icon: 'game-controller',
    color: '#FD79A8',
  },
  utilities: { label: 'Utilities', icon: 'flash', color: '#FDCB6E' },
  clothing: { label: 'Clothing', icon: 'shirt', color: '#00CEC9' },
  health: { label: 'Health', icon: 'medkit', color: '#00B894' },
  other: { label: 'Other', icon: 'ellipsis-horizontal', color: '#ADB5BD' },
};

// ─── Database ───────────────────────────────────────────────────

export const DB_NAME = 'studentos.db';

// ─── Currency ───────────────────────────────────────────────────

export const CURRENCIES = [
  { symbol: '$', label: 'USD' },
  { symbol: '€', label: 'EUR' },
  { symbol: '£', label: 'GBP' },
  { symbol: '₹', label: 'INR' },
  { symbol: '¥', label: 'JPY' },
] as const;
