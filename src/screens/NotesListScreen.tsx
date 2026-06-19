import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { useLibraryStore } from '../store/libraryStore';
import { NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

type NavProp = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const {
    folders,
    notebooks,
    currentFolderId,
    searchQuery,
    isLoading,
    loadLibrary,
    setCurrentFolder,
    setSearchQuery,
    createNotebook,
    createFolder,
    deleteNotebook,
  } = useLibraryStore();

  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary])
  );

  const filteredNotebooks = useMemo(() => {
    const folderFiltered = currentFolderId
      ? notebooks.filter((nb) => nb.folderId === currentFolderId)
      : notebooks;

    if (!searchQuery.trim()) return folderFiltered;
    const q = searchQuery.toLowerCase();
    return folderFiltered.filter((nb) => nb.title.toLowerCase().includes(q));
  }, [currentFolderId, notebooks, searchQuery]);

  const handleCreateNotebook = async () => {
    try {
      setCreating(true);
      const notebook = await createNotebook({
        title: `Notebook ${notebooks.length + 1}`,
        folderId: currentFolderId,
        coverColor: '#6C5CE7',
        coverIcon: 'book',
        template: 'lined',
        isFavorite: false,
      });
      navigation.navigate('NoteEditor', { notebookId: notebook.id });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFolder = async () => {
    const baseName = `Folder ${folders.length + 1}`;
    await createFolder({
      name: baseName,
      color: '#74B9FF',
      icon: 'folder',
      parentId: currentFolderId,
    });
  };

  const handleDeleteNotebook = (id: string, title: string) => {
    Alert.alert('Delete Notebook', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotebook(id),
      },
    ]);
  };

  const horizontalPadding = getScreenHorizontalPadding();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + rs(10), paddingHorizontal: horizontalPadding }]}> 
        <View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>StudentOS Library</Text>
          <Text style={[styles.title, { color: theme.text }]}>Notebooks</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('Flashcards')}
          >
            <Ionicons name="albums-outline" size={ri(18)} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.border }]}
            onPress={handleCreateFolder}
          >
            <Ionicons name="folder-open-outline" size={ri(18)} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={handleCreateNotebook}
            disabled={creating}
          >
            <Ionicons name="add" size={ri(22)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchWrap, { paddingHorizontal: horizontalPadding }]}> 
        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Ionicons name="search" size={ri(16)} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search notebooks"
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={[{ id: 'all', name: 'All' }, ...folders.map((f) => ({ id: f.id, name: f.name }))]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: rs(8), gap: rs(8) }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = item.id === 'all' ? !currentFolderId : currentFolderId === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.folderChip,
                {
                  borderColor: selected ? COLORS.primary : theme.border,
                  backgroundColor: selected ? `${COLORS.primary}1A` : 'transparent',
                },
              ]}
              onPress={() => setCurrentFolder(item.id === 'all' ? null : item.id)}
            >
              <Text style={{ color: selected ? COLORS.primary : theme.textSecondary, fontSize: rf(12), fontWeight: '600' }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filteredNotebooks}
        numColumns={2}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadLibrary} tintColor={COLORS.primary} />}
        columnWrapperStyle={{ paddingHorizontal: horizontalPadding, gap: rs(12) }}
        contentContainerStyle={{ paddingBottom: rs(140), gap: rs(12), paddingTop: rs(6) }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('NoteEditor', { notebookId: item.id })}
            onLongPress={() => handleDeleteNotebook(item.id, item.title)}
          >
            <View style={[styles.cover, { backgroundColor: item.coverColor }]}>
              <Ionicons name={(item.coverIcon as any) || 'book'} size={ri(26)} color="#fff" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.cardMeta, { color: theme.textTertiary }]}>{item.template.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No notebooks yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Create your first notebook to start writing.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: rs(10),
  },
  subtitle: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  title: {
    fontSize: rf(FONT_SIZES.display),
    fontWeight: '700',
    marginTop: rs(2),
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  iconButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rr(RADIUS.md),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: rs(38),
    height: rs(38),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: { paddingBottom: rs(8) },
  searchBox: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.lg),
    paddingHorizontal: rs(SPACING.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    height: rs(44),
  },
  searchInput: { flex: 1, fontSize: rf(FONT_SIZES.body) },
  folderChip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rr(999),
    borderWidth: 1,
  },
  card: {
    flex: 1,
    borderRadius: rr(RADIUS.lg),
    borderWidth: 1,
    padding: rs(12),
    minHeight: rs(170),
  },
  cover: {
    height: rs(86),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(10),
  },
  cardTitle: { fontSize: rf(FONT_SIZES.body), fontWeight: '700' },
  cardMeta: { marginTop: rs(6), fontSize: rf(FONT_SIZES.caption), fontWeight: '600' },
  emptyState: { paddingTop: rs(50), alignItems: 'center' },
  emptyTitle: { fontSize: rf(FONT_SIZES.title), fontWeight: '700' },
  emptyText: { marginTop: rs(8), fontSize: rf(FONT_SIZES.small) },
});
