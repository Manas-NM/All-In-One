import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcardsStore } from '../store/flashcardsStore';
import { useSubjectsStore } from '../store/subjectsStore';
import { NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;

export default function FlashcardsScreen() {
  const navigation = useNavigation<NavProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const { decks, deckInfoMap, isLoading, loadDecks, createDeck, deleteDeck } = useFlashcardsStore();
  const { subjects } = useSubjectsStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [deckDesc, setDeckDesc] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [])
  );

  const handleCreate = async () => {
    if (!deckName.trim()) return;
    const deck = await createDeck({
      name: deckName.trim(),
      description: deckDesc.trim(),
      subjectId: null,
      noteId: null,
    });
    setDeckName('');
    setDeckDesc('');
    setShowCreate(false);
    navigation.navigate('FlashcardDeck', { deckId: deck.id });
  };

  const handleDeleteDeck = (id: string, name: string) => {
    Alert.alert('Delete Deck', `Delete "${name}" and all its cards?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDeck(id) },
    ]);
  };

  const horizontalPadding = getScreenHorizontalPadding();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rs(SPACING.sm), paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={ri(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
        <View style={{ width: ri(24) }} />
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const info = deckInfoMap[item.id] ?? { cardCount: 0, dueCount: 0 };
          const subject = item.subjectId ? subjects.find((s) => s.id === item.subjectId) : null;

          return (
            <TouchableOpacity
              style={[styles.deckCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => navigation.navigate('FlashcardDeck', { deckId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.deckRow}>
                <View style={styles.deckInfo}>
                  <Text style={[styles.deckName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.deckDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.deckMeta}>
                    <Text style={[styles.deckCount, { color: theme.textTertiary }]}>
                      {info.cardCount} card{info.cardCount !== 1 ? 's' : ''}
                    </Text>
                    {subject && (
                      <View style={[styles.subjectBadge, { backgroundColor: subject.color + '20' }]}>
                        <Text style={[styles.subjectBadgeText, { color: subject.color }]}>
                          {subject.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.deckRight}>
                  {info.dueCount > 0 && (
                    <View style={[styles.dueBadge, { backgroundColor: COLORS.error }]}>
                      <Text style={styles.dueBadgeText}>{info.dueCount}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteDeck(item.id, item.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={ri(18)} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + rs(100) },
        ]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDecks} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={ri(48)} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No decks yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textTertiary }]}>
              Create a deck or generate flashcards from your notes
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + rs(20) }]}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add" size={ri(28)} color="#FFF" />
      </TouchableOpacity>

      {/* Create Deck Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.modalBtn, { color: COLORS.error }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Deck</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!deckName.trim()}>
              <Text style={[styles.modalBtn, { color: deckName.trim() ? COLORS.primary : theme.textTertiary }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={deckName}
              onChangeText={setDeckName}
              placeholder="Deck name"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={deckDesc}
              onChangeText={setDeckDesc}
              placeholder="Optional description"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: rs(SPACING.md),
  },
  title: { fontSize: rf(FONT_SIZES.heading), fontWeight: '800' },
  list: { paddingTop: rs(SPACING.sm) },
  deckCard: {
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.lg),
    marginBottom: rs(SPACING.md),
    borderWidth: 0.5,
  },
  deckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deckInfo: { flex: 1, marginRight: rs(SPACING.md) },
  deckName: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '600' },
  deckDesc: { fontSize: rf(FONT_SIZES.small), marginTop: rs(SPACING.xxs) },
  deckMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(SPACING.sm), marginTop: rs(SPACING.xs) },
  deckCount: { fontSize: rf(FONT_SIZES.small) },
  subjectBadge: { paddingHorizontal: rs(SPACING.sm), paddingVertical: rs(SPACING.xxs), borderRadius: rr(RADIUS.sm) },
  subjectBadgeText: { fontSize: rf(FONT_SIZES.caption), fontWeight: '600' },
  deckRight: { alignItems: 'center', gap: rs(SPACING.sm) },
  dueBadge: {
    minWidth: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(6),
  },
  dueBadgeText: { color: '#FFF', fontSize: rf(FONT_SIZES.caption), fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: rs(80), gap: rs(SPACING.sm) },
  emptyTitle: { fontSize: rf(FONT_SIZES.title), fontWeight: '600' },
  emptyDesc: { fontSize: rf(FONT_SIZES.body), textAlign: 'center' },
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
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.md),
    borderBottomWidth: 0.5,
  },
  modalBtn: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '500' },
  modalTitle: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '700' },
  modalContent: { padding: getScreenHorizontalPadding(), paddingTop: rs(SPACING.xl) },
  inputLabel: { fontSize: rf(FONT_SIZES.body), fontWeight: '600', marginBottom: rs(SPACING.sm), marginTop: rs(SPACING.lg) },
  input: {
    borderWidth: 0.5,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.body),
  },
});
