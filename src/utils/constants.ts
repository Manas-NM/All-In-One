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

// ─── Subject Preset Colors ───────────────────────────────────────

export const SUBJECT_COLORS = [
  '#6C5CE7', // purple
  '#E17055', // red
  '#00B894', // green
  '#74B9FF', // blue
  '#FD79A8', // pink
  '#FDCB6E', // yellow
  '#00CEC9', // teal
  '#ADB5BD', // gray
] as const;

// ─── Subject Icons ───────────────────────────────────────────────

export const SUBJECT_ICONS = [
  { name: 'book', label: 'Book' },
  { name: 'flask', label: 'Science' },
  { name: 'calculator', label: 'Calculator' },
  { name: 'globe', label: 'Globe' },
  { name: 'color-palette', label: 'Palette' },
  { name: 'musical-notes', label: 'Music' },
  { name: 'football', label: 'Sports' },
] as const;

// ─── Task Priority Config ────────────────────────────────────────

export const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#E17055', icon: 'flag' },
  medium: { label: 'Medium', color: '#FDCB6E', icon: 'flag' },
  low: { label: 'Low', color: '#00B894', icon: 'flag' },
} as const;

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

// ─── Responsive Design Tokens ───────────────────────────────────
// Base (un-scaled) sizes. Pass these through helpers in
// `./responsive.ts` (e.g. `rf`, `rs`, `rr`) before applying.
// Centralizing them here keeps the design language consistent across
// screens and components.

export const FONT_SIZES = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 15,
  subtitle: 16,
  title: 18,
  titleLarge: 20,
  heading: 24,
  display: 28,
  hero: 32,
  amount: 36,
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 999,
} as const;

export const HIT_SIZES = {
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  tapTarget: 44, // Apple HIG minimum
} as const;
