import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri } from '../utils/responsive';

interface HabitCardProps {
  habit: Habit;
  isCheckedIn: boolean;
  currentStreak: number;
  weekCompletions: number;
  onCheckIn: () => void;
  onPress: () => void;
}

export default function HabitCard({
  habit,
  isCheckedIn,
  currentStreak,
  weekCompletions,
  onCheckIn,
  onPress,
}: HabitCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const target = habit.frequency === 'daily' ? 7 : habit.targetDays;
  const progress = Math.min(weekCompletions / target, 1);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: habit.color + '20' }]}>
          <Ionicons name={habit.icon as any} size={ri(22)} color={habit.color} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.metaRow}>
            {currentStreak > 0 && (
              <Text style={[styles.streak, { color: COLORS.warning }]}>
                🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}
              </Text>
            )}
            <Text style={[styles.freq, { color: theme.textSecondary }]}>
              {habit.frequency === 'daily' ? 'Daily' : `${habit.targetDays}×/week`}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressBg, { backgroundColor: theme.surfaceSecondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: habit.color },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textTertiary }]}>
            {weekCompletions}/{target} this week
          </Text>
        </View>

        {/* Check-in circle */}
        <TouchableOpacity
          style={[
            styles.checkBtn,
            {
              backgroundColor: isCheckedIn ? habit.color : 'transparent',
              borderColor: habit.color,
            },
          ]}
          onPress={onCheckIn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isCheckedIn && (
            <Ionicons name="checkmark" size={ri(20)} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.lg),
    marginBottom: rs(SPACING.md),
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: rs(44),
    height: rs(44),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(SPACING.md),
  },
  info: {
    flex: 1,
    marginRight: rs(SPACING.md),
  },
  name: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(SPACING.xxs),
    gap: rs(SPACING.sm),
  },
  streak: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '600',
  },
  freq: {
    fontSize: rf(FONT_SIZES.small),
  },
  progressBg: {
    height: rs(6),
    borderRadius: rr(RADIUS.pill),
    marginTop: rs(SPACING.sm),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: rr(RADIUS.pill),
  },
  progressLabel: {
    fontSize: rf(FONT_SIZES.caption),
    marginTop: rs(SPACING.xxs),
  },
  checkBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
