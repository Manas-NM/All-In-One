import React, { useEffect, useState, useCallback } from 'react';
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
import { COLORS, CATEGORY_CONFIG } from '../utils/constants';
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

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const config = CATEGORY_CONFIG[item.category];
    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: theme.surface }]}
        onLongPress={() => handleDeleteExpense(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.expenseIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDesc, { color: theme.text }]}>
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
    );
  };

  const ListHeader = () => (
    <View>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.text }]}>
          {formatMonth(selectedMonth)}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>
          {currency}{total.toFixed(2)}
        </Text>
        <Text style={styles.totalSub}>
          {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* View Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: theme.surfaceSecondary }]}>
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
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💸</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Finance Tracker
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Expenses</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={viewMode === 'list' ? expenses : []}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingVertical: 12,
  },
  monthArrow: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  totalCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  totalAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 4,
  },
  totalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
