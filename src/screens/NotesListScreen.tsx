import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../store/notesStore';
import NoteCard from '../components/NoteCard';
import { NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import {
  rf,
  rs,
  ri,
  getScreenHorizontalPadding,
  getMaxContentWidth,
} from '../utils/responsive';

type NavProp = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { notes, isLoading, loadNotes, deleteNote, toggleFavorite } =
    useNotesStore();

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  const handleDeleteNote = (id: string, title: string) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${title || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNote(id),
        },
      ]
    );
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Favorites first, then by update date
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Mirrors the FinanceScreen header math so all screens line up at the
  // same vertical baseline regardless of device.
  const headerTopPadding = Math.max(insets.top, rs(12)) + rs(8);
  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

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
            Your Notes
          </Text>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={handleCreateNote}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={ri(24)} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      {notes.length === 0 ? (
        <View style={[styles.emptyState, { paddingBottom: insets.bottom + rs(100) }]}>
          <Text style={{ fontSize: rf(56), marginBottom: rs(16) }}>📝</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No notes yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tap the + button to create your first note
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: 'center',
                width: '100%',
                maxWidth: maxContentWidth,
              }}
            >
              <NoteCard
                note={item}
                onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onDelete={() => handleDeleteNote(item.id, item.title)}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + rs(100) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadNotes}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
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
    paddingBottom: rs(SPACING.md),
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
  list: {
    paddingVertical: rs(SPACING.sm),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: rf(FONT_SIZES.titleLarge),
    fontWeight: '600',
    marginBottom: rs(SPACING.sm),
  },
  emptySubtitle: {
    fontSize: rf(FONT_SIZES.body),
    textAlign: 'center',
    paddingHorizontal: rs(SPACING.huge),
  },
});
