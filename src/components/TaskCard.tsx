import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Subject } from '../types';
import {
  COLORS,
  PRIORITY_CONFIG,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from '../utils/constants';
import {
  rf,
  rs,
  rr,
  ri,
  getScreenHorizontalPadding,
} from '../utils/responsive';

interface TaskCardProps {
  task: Task;
  subject?: Subject | null;
  noteTitle?: string | null;
  onToggleComplete: () => void;
  onPress: () => void;
  onDelete: () => void;
}

export default function TaskCard({
  task,
  subject,
  noteTitle,
  onToggleComplete,
  onPress,
  onDelete,
}: TaskCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const horizontalPadding = getScreenHorizontalPadding();

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: `${Math.abs(days)}d overdue`, overdue: true };
    if (days === 0) return { text: 'Due today', overdue: false };
    if (days === 1) return { text: 'Due tomorrow', overdue: false };
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overdue: false,
    };
  };

  const dueInfo = formatDate(task.dueDate);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
          marginHorizontal: horizontalPadding,
          opacity: task.completed ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: task.completed ? COLORS.success : priorityConfig.color,
            backgroundColor: task.completed ? COLORS.success : 'transparent',
          },
        ]}
        onPress={onToggleComplete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={ri(14)} color="#FFF" />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          {/* Priority dot */}
          <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
          <Text style={[styles.metaText, { color: theme.textTertiary }]}>
            {priorityConfig.label}
          </Text>

          {/* Due date */}
          {dueInfo && (
            <>
              <Text style={[styles.metaSep, { color: theme.textTertiary }]}>•</Text>
              <Text
                style={[
                  styles.metaText,
                  { color: dueInfo.overdue ? COLORS.error : theme.textTertiary },
                ]}
              >
                {dueInfo.text}
              </Text>
            </>
          )}

          {/* Subject badge */}
          {subject && (
            <>
              <Text style={[styles.metaSep, { color: theme.textTertiary }]}>•</Text>
              <View style={[styles.badge, { backgroundColor: subject.color + '20' }]}>
                <View style={[styles.badgeDot, { backgroundColor: subject.color }]} />
                <Text style={[styles.badgeText, { color: subject.color }]} numberOfLines={1}>
                  {subject.name}
                </Text>
              </View>
            </>
          )}

          {/* Linked note badge */}
          {noteTitle && (
            <>
              <Text style={[styles.metaSep, { color: theme.textTertiary }]}>•</Text>
              <Ionicons name="document-text-outline" size={ri(11)} color={theme.textTertiary} />
            </>
          )}
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={ri(16)} color={theme.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md),
    marginVertical: rs(4),
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  checkbox: {
    width: ri(22),
    height: ri(22),
    borderRadius: ri(22) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.md),
    marginTop: rs(2),
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    fontWeight: '500',
  },
  description: {
    fontSize: rf(FONT_SIZES.small),
    marginTop: rs(2),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(SPACING.xs),
    flexWrap: 'wrap',
    gap: rs(4),
  },
  priorityDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },
  metaText: {
    fontSize: rf(FONT_SIZES.caption),
  },
  metaSep: {
    fontSize: rf(FONT_SIZES.caption),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.xs),
    paddingHorizontal: rs(SPACING.xs + 2),
    paddingVertical: rs(1),
  },
  badgeDot: {
    width: rs(5),
    height: rs(5),
    borderRadius: rs(3),
    marginRight: rs(3),
  },
  badgeText: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '500',
    maxWidth: rs(80),
  },
  deleteBtn: {
    padding: rs(SPACING.xs),
    marginLeft: rs(SPACING.sm),
  },
});
