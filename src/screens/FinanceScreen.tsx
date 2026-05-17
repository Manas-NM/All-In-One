import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/financeStore';
import ExpenseChart from '../components/ExpenseChart';
import ExpenseForm from '../components/ExpenseForm';
import {
  COLORS,
  CATEGORY_CONFIG,
  FONT_SIZES,
  SPACING,
  RADIUS,
  HIT_SIZES,
} from '../utils/constants';
import {
  rf,
  rs,
  rr,
  ri,
  getScreenHorizontalPadding,
  getMaxContentWidth,
  isTablet,
} from '../utils/responsive';
import { Expense, ExpenseCategory } from '../types';
import { getSetting } from '../services/database';

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const {
    expenses,
    monthlyTotals,
    categoryTotals,
    selectedMonth,
    loadExpenses,
    loadStats,
    addExpense,
    deleteExpense,
    setSelectedMonth,
    getTotalForMonth,
  } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      loadStats();
      loadCurrency();
    }, [selectedMonth])
  );

  const loadCurrency = async () => {
    const saved = await getSetting('currency');
    if (saved) setCurrency(saved);
  };

  const handleAddExpense = async (expense: {
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
  }) => {
    await addExpense(expense);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExpense(id),
      },
    ]);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  const total = getTotalForMonth();
  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const config = CATEGORY_CONFIG[item.category];
    return (
      <View style={styles.contentRow}>
        <TouchableOpacity
          style={[
            styles.expenseItem,
            {
              backgroundColor: theme.surface,
              maxWidth: maxContentWidth,
              marginHorizontal: horizontalPadding,
            },
          ]}
          onLongPress={() => handleDeleteExpense(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.expenseIcon, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon as any} size={ri(18)} color={config.color} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseDesc, { color: theme.text }]} numberOfLines={1}>
              {item.description || config.label}
            </Text>
            <Text style={[styles.expenseDate, { color: theme.textTertiary }]}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text style={[styles.expenseAmount, { color: COLORS.error }]}>
            -{currency}{item.amount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={{ width: '100%', alignSelf: 'center', maxWidth: maxContentWidth }}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={ri(20)} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>
          {formatMonth(selectedMonth)}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={ri(20)} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View
        style={[
          styles.totalCard,
          { backgroundColor: COLORS.primary, marginHorizontal: horizontalPadding },
        ]}
      >
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>
          {currency}{total.toFixed(2)}
        </Text>
        <Text style={styles.totalSub}>
          {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* View Toggle */}
      <View
        style={[
          styles.toggleRow,
          {
            backgroundColor: theme.surfaceSecondary,
            marginHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'list' ? '#FFF' : theme.textSecondary },
            ]}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'charts' && styles.toggleActive]}
          onPress={() => setViewMode('charts')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: viewMode === 'charts' ? '#FFF' : theme.textSecondary },
            ]}
          >
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'charts' && (
        <ExpenseChart
          monthlyTotals={monthlyTotals}
          categoryTotals={categoryTotals}
          currency={currency}
        />
      )}

      {viewMode === 'list' && expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: rf(48), marginBottom: rs(12) }}>💸</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No expenses this month
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tap + to add your first expense
          </Text>
        </View>
      )}
    </View>
  );

  // Calculate proper top padding: safe area inset + breathing room.
  // The previous version used insets.top + 12 which still felt tight on
  // notched devices because the title's line-height pushed it into the
  // status bar / dynamic island. Adding a baseline of rs(16) ensures
  // visual separation on all devices including iPhone SE (no notch).
  const headerTopPadding = Math.max(insets.top, rs(12)) + rs(8);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: headerTopPadding,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.headerTextWrap}>
          <Text
            style={[styles.greeting, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            Finance Tracker
          </Text>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            Expenses
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setShowForm(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={ri(24)} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={viewMode === 'list' ? expenses : []}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + rs(100) }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Expense Modal */}
      <ExpenseForm
        visible={showForm}
        currency={currency}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddExpense}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: rs(SPACING.sm),
    // The top padding is set dynamically based on safe-area insets.
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: rs(SPACING.md),
  },
  greeting: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: rf(FONT_SIZES.display),
    fontWeight: '700',
    marginTop: rs(2),
    // Increase line height a touch so descenders don't get cropped.
    lineHeight: rf(FONT_SIZES.display) * 1.2,
  },
  addButton: {
    width: ri(44),
    height: ri(44),
    borderRadius: ri(44) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(SPACING.md),
  },
  monthArrow: {
    padding: rs(SPACING.sm),
  },
  monthText: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
    marginHorizontal: rs(SPACING.lg),
  },
  totalCard: {
    borderRadius: rr(RADIUS.xxl),
    padding: rs(SPACING.xxl),
    alignItems: 'center',
    marginBottom: rs(SPACING.lg),
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  totalAmount: {
    color: '#FFF',
    fontSize: rf(FONT_SIZES.amount),
    fontWeight: '800',
    marginVertical: rs(SPACING.xs),
  },
  totalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: rf(FONT_SIZES.small),
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: rr(RADIUS.md),
    padding: 3,
    marginBottom: rs(SPACING.lg),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: rs(SPACING.sm),
    borderRadius: rr(RADIUS.sm),
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  list: {
    // Bottom padding is set dynamically based on safe-area insets.
  },
  contentRow: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: getMaxContentWidth(),
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: rs(SPACING.xs),
    padding: rs(SPACING.md + 2),
    borderRadius: rr(RADIUS.lg),
  },
  expenseIcon: {
    width: ri(40),
    height: ri(40),
    borderRadius: rr(RADIUS.lg),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.md),
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: rf(FONT_SIZES.small),
    marginTop: rs(2),
  },
  expenseAmount: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    fontWeight: '700',
    marginLeft: rs(SPACING.sm),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: rs(SPACING.huge),
  },
  emptyTitle: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '600',
    marginBottom: rs(SPACING.xs + 2),
  },
  emptySubtitle: {
    fontSize: rf(FONT_SIZES.body),
  },
});
