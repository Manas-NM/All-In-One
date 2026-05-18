import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../store/notesStore';
import { useSubjectsStore } from '../store/subjectsStore';
import NoteCard from '../components/NoteCard';
import { NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import {
  rf,
  rs,
  rr,
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
  const { subjects, loadSubjects } = useSubjectsStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadNotes();
      loadSubjects();
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

  // Filter by subject
  let filteredNotes = selectedSubjectId
    ? notes.filter((n) => n.subjectId === selectedSubjectId)
    : notes;

  // Filter by search (title, textContent, ocrText)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.textContent.toLowerCase().includes(q) ||
        (n.ocrText && n.ocrText.toLowerCase().includes(q))
    );
  }

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

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
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('Flashcards')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="albums-outline" size={ri(18)} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('Subjects')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="folder-outline" size={ri(18)} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={handleCreateNote}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={ri(24)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchRow, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={ri(16)} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes & OCR text..."
            placeholderTextColor={theme.textTertiary}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Subject Filter Tabs */}
      {subjects.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterTabs,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.filterTab,
              {
                backgroundColor: !selectedSubjectId
                  ? COLORS.primary + '15'
                  : 'transparent',
                borderColor: !selectedSubjectId
                  ? COLORS.primary
                  : theme.border,
              },
            ]}
            onPress={() => setSelectedSubjectId(null)}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color: !selectedSubjectId
                    ? COLORS.primary
                    : theme.textSecondary,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    selectedSubjectId === subject.id
                      ? subject.color + '20'
                      : 'transparent',
                  borderColor:
                    selectedSubjectId === subject.id
                      ? subject.color
                      : theme.border,
                },
              ]}
              onPress={() =>
                setSelectedSubjectId(
                  selectedSubjectId === subject.id ? null : subject.id
                )
              }
            >
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: subject.color },
                ]}
              />
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      selectedSubjectId === subject.id
                        ? subject.color
                        : theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <View style={[styles.emptyState, { paddingBottom: insets.bottom + rs(100) }]}>
          <Text style={{ fontSize: rf(56), marginBottom: rs(16) }}>📝</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {searchQuery.trim()
              ? 'No matching notes'
              : selectedSubjectId
              ? 'No notes in this subject'
              : 'No notes yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Tap the + button to create your first note'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const subject = subjects.find((s) => s.id === item.subjectId);
            return (
              <View
                style={{
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: maxContentWidth,
                }}
              >
                <NoteCard
                  note={item}
                  subject={subject}
                  onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onDelete={() => handleDeleteNote(item.id, item.title)}
                />
              </View>
            );
          }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.sm),
  },
  headerIconBtn: {
    width: ri(38),
    height: ri(38),
    borderRadius: ri(38) / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchRow: {
    marginBottom: rs(SPACING.sm),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    paddingHorizontal: rs(SPACING.md),
    paddingVertical: rs(SPACING.sm),
    gap: rs(SPACING.sm),
  },
  searchInput: {
    flex: 1,
    fontSize: rf(FONT_SIZES.body),
    padding: 0,
  },
  filterTabs: {
    gap: rs(SPACING.sm),
    paddingBottom: rs(SPACING.sm),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rr(RADIUS.pill),
    paddingHorizontal: rs(SPACING.md),
    paddingVertical: rs(SPACING.xs + 2),
    gap: rs(SPACING.xs),
  },
  filterDot: {
    width: rs(7),
    height: rs(7),
    borderRadius: rs(4),
  },
  filterTabText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
    maxWidth: rs(100),
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
