import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note, Subject } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import {
  rf,
  rs,
  rr,
  ri,
  getScreenHorizontalPadding,
} from '../utils/responsive';

interface NoteCardProps {
  note: Note;
  subject?: Subject | null;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export default function NoteCard({
  note,
  subject,
  onPress,
  onToggleFavorite,
  onDelete,
}: NoteCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasDrawing = note.content && note.content !== '[]';
  const preview = note.textContent.substring(0, 120);
  const horizontalPadding = getScreenHorizontalPadding();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
          marginHorizontal: horizontalPadding,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: note.color }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
          >
            {note.title || 'Untitled Note'}
          </Text>
          <TouchableOpacity
            onPress={onToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={note.isFavorite ? 'star' : 'star-outline'}
              size={ri(18)}
              color={note.isFavorite ? COLORS.warning : theme.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Subject badge */}
        {subject && (
          <View style={[styles.subjectBadge, { backgroundColor: subject.color + '18' }]}>
            <Ionicons name={subject.icon as any} size={ri(11)} color={subject.color} />
            <Text style={[styles.subjectBadgeText, { color: subject.color }]} numberOfLines={1}>
              {subject.name}
            </Text>
          </View>
        )}

        {/* Preview */}
        {preview ? (
          <Text
            style={[styles.preview, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {preview}
          </Text>
        ) : hasDrawing ? (
          <View style={styles.drawingBadge}>
            <Ionicons name="brush-outline" size={ri(12)} color={COLORS.primary} />
            <Text style={[styles.drawingText, { color: COLORS.primary }]}>
              Contains drawing
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.date, { color: theme.textTertiary }]}>
              {formatDate(note.updatedAt)}
            </Text>
            {note.aiSummary && (
              <View style={styles.aiIndicator}>
                <Text style={styles.aiIcon}>✨</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={ri(16)} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: rr(RADIUS.xl),
    marginVertical: rs(6),
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  accentBar: {
    width: rs(5),
  },
  content: {
    flex: 1,
    padding: rs(SPACING.md + 2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(4),
  },
  title: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
    flex: 1,
    marginRight: rs(SPACING.sm),
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: rr(RADIUS.xs),
    paddingHorizontal: rs(SPACING.sm),
    paddingVertical: rs(2),
    marginBottom: rs(SPACING.xs),
    gap: rs(4),
  },
  subjectBadgeText: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '500',
    maxWidth: rs(120),
  },
  preview: {
    fontSize: rf(FONT_SIZES.body),
    lineHeight: rf(FONT_SIZES.body) * 1.4,
    marginBottom: rs(SPACING.sm),
  },
  drawingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.xs),
    marginBottom: rs(SPACING.sm),
  },
  drawingText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.xs),
  },
  date: {
    fontSize: rf(FONT_SIZES.caption),
  },
  aiIndicator: {
    marginLeft: rs(2),
  },
  aiIcon: {
    fontSize: rf(10),
  },
});
