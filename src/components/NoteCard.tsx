import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';
import { COLORS } from '../utils/constants';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export default function NoteCard({
  note,
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
  const preview = note.textContent.substring(0, 80);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
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
          <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={note.isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={note.isFavorite ? COLORS.warning : theme.textTertiary}
            />
          </TouchableOpacity>
        </View>

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
            <Ionicons name="brush-outline" size={12} color={COLORS.primary} />
            <Text style={[styles.drawingText, { color: COLORS.primary }]}>
              Contains drawing
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.textTertiary }]}>
            {formatDate(note.updatedAt)}
          </Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  accentBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  drawingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  drawingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
  },
});
