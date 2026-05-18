import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitStats } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

interface HabitDetailModalProps {
  visible: boolean;
  habit: Habit | null;
  stats: HabitStats;
  monthDays: number[]; // days of month that are completed
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitDetailModal({
  visible,
  habit,
  stats,
  monthDays,
  onClose,
  onEdit,
  onDelete,
}: HabitDetailModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  if (!habit) return null;

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const handleDelete = () => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Day headers
    dayLabels.forEach((d, i) => (
      cells.push(
        <View key={`h-${i}`} style={styles.calCell}>
          <Text style={[styles.calDayLabel, { color: theme.textTertiary }]}>{d}</Text>
        </View>
      )
    ));

    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<View key={`e-${i}`} style={styles.calCell} />);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const isCompleted = monthDays.includes(d);
      const isToday =
        d === new Date().getDate() &&
        viewMonth.month === new Date().getMonth() &&
        viewMonth.year === new Date().getFullYear();

      cells.push(
        <View key={`d-${d}`} style={styles.calCell}>
          <View
            style={[
              styles.calDay,
              isCompleted && { backgroundColor: habit.color },
              isToday && !isCompleted && { borderWidth: 1.5, borderColor: habit.color },
            ]}
          >
            <Text
              style={[
                styles.calDayText,
                { color: isCompleted ? '#FFF' : theme.text },
              ]}
            >
              {d}
            </Text>
          </View>
        </View>
      );
    }

    return cells;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={ri(24)} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onEdit} style={{ marginRight: rs(SPACING.md) }}>
              <Ionicons name="pencil" size={ri(20)} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash" size={ri(20)} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(40) }]}
        >
          {/* Stats cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>{stats.totalCompletions}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                🔥 {stats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                ⭐ {stats.bestStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.thisWeekCompletions}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>This Week</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.thisMonthCompletions}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>This Month</Text>
            </View>
          </View>

          {/* Calendar Heatmap */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Calendar</Text>
          <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => {
                  const m = viewMonth.month - 1;
                  setViewMonth({
                    year: m < 0 ? viewMonth.year - 1 : viewMonth.year,
                    month: m < 0 ? 11 : m,
                  });
                }}
              >
                <Ionicons name="chevron-back" size={ri(20)} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: theme.text }]}>{monthName}</Text>
              <TouchableOpacity
                onPress={() => {
                  const m = viewMonth.month + 1;
                  setViewMonth({
                    year: m > 11 ? viewMonth.year + 1 : viewMonth.year,
                    month: m > 11 ? 0 : m,
                  });
                }}
              >
                <Ionicons name="chevron-forward" size={ri(20)} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calGrid}>{renderCalendar()}</View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.md),
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '700',
    flex: 1,
    marginHorizontal: rs(SPACING.md),
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: getScreenHorizontalPadding(),
    paddingTop: rs(SPACING.xl),
  },
  statsRow: {
    flexDirection: 'row',
    gap: rs(SPACING.md),
    marginBottom: rs(SPACING.md),
  },
  statCard: {
    flex: 1,
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md),
    alignItems: 'center',
  },
  statValue: {
    fontSize: rf(FONT_SIZES.titleLarge),
    fontWeight: '700',
  },
  statLabel: {
    fontSize: rf(FONT_SIZES.caption),
    marginTop: rs(SPACING.xxs),
  },
  sectionTitle: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '700',
    marginTop: rs(SPACING.xl),
    marginBottom: rs(SPACING.md),
  },
  calendarCard: {
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md),
    borderWidth: 0.5,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(SPACING.md),
  },
  monthLabel: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(2),
  },
  calDay: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDayText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  calDayLabel: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '600',
  },
});
