import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitsStore } from '../store/habitsStore';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import HabitDetailModal from '../components/HabitDetailModal';
import { printHabitReport } from '../services/printService';
import { Habit, HabitFrequency } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding, pickByDevice } from '../utils/responsive';

type FilterType = 'all' | 'daily' | 'weekly';

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const {
    habits,
    isLoading,
    loadHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    checkInHabit,
    uncheckHabit,
    isCheckedInToday,
    getCurrentStreak,
    getWeekCompletions,
    getHabitStats,
    getHabitLogsForMonth,
  } = useHabitsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const filteredHabits = habits.filter((h) => {
    if (filter === 'all') return true;
    return h.frequency === filter;
  });

  const handleCheckIn = async (habitId: string) => {
    if (isCheckedInToday(habitId)) {
      await uncheckHabit(habitId);
    } else {
      await checkInHabit(habitId);
    }
  };

  const handleSubmit = async (data: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await addHabit(data);
    }
    setEditingHabit(undefined);
  };

  const handleHabitPress = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowDetail(true);
  };

  const handleEditFromDetail = () => {
    if (selectedHabit) {
      setShowDetail(false);
      setEditingHabit(selectedHabit);
      setShowForm(true);
    }
  };

  const handleDeleteFromDetail = async () => {
    if (selectedHabit) {
      await deleteHabit(selectedHabit.id);
      setShowDetail(false);
      setSelectedHabit(null);
    }
  };

  const now = new Date();
  const detailMonthDays = selectedHabit
    ? getHabitLogsForMonth(selectedHabit.id, now.getFullYear(), now.getMonth())
    : [];

  const detailStats = selectedHabit
    ? getHabitStats(selectedHabit.id)
    : { totalCompletions: 0, currentStreak: 0, bestStreak: 0, thisWeekCompletions: 0, thisMonthCompletions: 0 };

  const headerTopPadding = insets.top + rs(SPACING.sm);
  const horizontalPadding = getScreenHorizontalPadding();

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTopPadding, paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: theme.text }]}>Habits</Text>
        {habits.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              const data = habits.map((h) => ({
                habit: h,
                stats: getHabitStats(h.id),
              }));
              const now = new Date();
              await printHabitReport(data, `${now.toLocaleDateString()} Report`);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="print-outline" size={ri(22)} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={[styles.filterRow, { paddingHorizontal: horizontalPadding }]}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f.key ? COLORS.primary : theme.surface,
                borderColor: filter === f.key ? COLORS.primary : theme.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? '#FFF' : theme.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Habit List */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            isCheckedIn={isCheckedInToday(item.id)}
            currentStreak={getCurrentStreak(item.id)}
            weekCompletions={getWeekCompletions(item.id)}
            onCheckIn={() => handleCheckIn(item.id)}
            onPress={() => handleHabitPress(item)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + rs(100),
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadHabits} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={ri(48)} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No habits yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textTertiary }]}>
              Tap + to create your first habit
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + rs(20) }]}
        onPress={() => {
          setEditingHabit(undefined);
          setShowForm(true);
        }}
      >
        <Ionicons name="add" size={ri(28)} color="#FFF" />
      </TouchableOpacity>

      {/* Form Modal */}
      <HabitForm
        visible={showForm}
        habit={editingHabit}
        onClose={() => {
          setShowForm(false);
          setEditingHabit(undefined);
        }}
        onSubmit={handleSubmit}
      />

      {/* Detail Modal */}
      <HabitDetailModal
        visible={showDetail}
        habit={selectedHabit}
        stats={detailStats}
        monthDays={detailMonthDays}
        onClose={() => setShowDetail(false)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
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
    paddingBottom: rs(SPACING.md),
  },
  title: {
    fontSize: rf(FONT_SIZES.heading),
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    marginBottom: rs(SPACING.md),
  },
  filterBtn: {
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.sm),
    borderRadius: rr(RADIUS.pill),
    borderWidth: 0.5,
  },
  filterText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  list: {
    paddingTop: rs(SPACING.sm),
  },
  empty: {
    alignItems: 'center',
    marginTop: rs(80),
    gap: rs(SPACING.sm),
  },
  emptyTitle: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: rf(FONT_SIZES.body),
  },
  fab: {
    position: 'absolute',
    right: rs(20),
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
