import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcardsStore } from '../store/flashcardsStore';
import FlashcardForm from '../components/FlashcardForm';
import { printFlashcards } from '../services/printService';
import { Flashcard, NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;
type RoutePropType = RouteProp<NotesStackParamList, 'FlashcardDeck'>;

export default function FlashcardDeckScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { deckId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const { decks, cards, loadCards, addCard, updateCard, deleteCard, getDueCards, deckInfoMap } =
    useFlashcardsStore();

  const deck = decks.find((d) => d.id === deckId);
  const deckCards = cards[deckId] ?? [];
  const info = deckInfoMap[deckId] ?? { cardCount: 0, dueCount: 0 };

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadCards(deckId);
    }, [deckId])
  );

  const handleAddCard = async (front: string, back: string) => {
    if (editingCard) {
      await updateCard(editingCard.id, { front, back });
      setEditingCard(null);
    } else {
      await addCard({
        deckId,
        front,
        back,
        difficulty: 1,
        nextReviewDate: Date.now(),
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
      });
    }
  };

  const handleDeleteCard = (card: Flashcard) => {
    Alert.alert('Delete Card', 'Delete this flashcard?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCard(card.id, deckId) },
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
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {deck?.name ?? 'Deck'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (deck && deckCards.length > 0) {
              printFlashcards(deck, deckCards);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={deckCards.length === 0}
        >
          <Ionicons name="print-outline" size={ri(22)} color={deckCards.length > 0 ? theme.text : theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Study buttons */}
      <View style={[styles.studyRow, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity
          style={[styles.studyBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('FlashcardStudy', { deckId, studyAll: false })}
          disabled={info.dueCount === 0}
        >
          <Ionicons name="play" size={ri(18)} color="#FFF" />
          <Text style={styles.studyBtnText}>
            Study Due ({info.dueCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.studyBtn, { backgroundColor: COLORS.accent }]}
          onPress={() => navigation.navigate('FlashcardStudy', { deckId, studyAll: true })}
          disabled={deckCards.length === 0}
        >
          <Ionicons name="albums" size={ri(18)} color="#FFF" />
          <Text style={styles.studyBtnText}>Study All</Text>
        </TouchableOpacity>
      </View>

      {/* Cards list */}
      <FlatList
        data={deckCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isDue = item.nextReviewDate <= Date.now();
          return (
            <TouchableOpacity
              style={[styles.cardItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                setEditingCard(item);
                setShowForm(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardFront, { color: theme.text }]} numberOfLines={2}>
                  {item.front}
                </Text>
                <Text style={[styles.cardBack, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.back}
                </Text>
                <View style={styles.cardMeta}>
                  {isDue && (
                    <View style={[styles.dueTag, { backgroundColor: COLORS.error + '20' }]}>
                      <Text style={[styles.dueTagText, { color: COLORS.error }]}>Due</Text>
                    </View>
                  )}
                  <Text style={[styles.reviewCount, { color: theme.textTertiary }]}>
                    Reviewed {item.reviewCount}×
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCard(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={ri(16)} color={COLORS.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + rs(100) },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="documents-outline" size={ri(48)} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No cards yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textTertiary }]}>
              Tap + to add a flashcard
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + rs(20) }]}
        onPress={() => {
          setEditingCard(null);
          setShowForm(true);
        }}
      >
        <Ionicons name="add" size={ri(28)} color="#FFF" />
      </TouchableOpacity>

      <FlashcardForm
        visible={showForm}
        initialFront={editingCard?.front}
        initialBack={editingCard?.back}
        onClose={() => {
          setShowForm(false);
          setEditingCard(null);
        }}
        onSubmit={handleAddCard}
      />
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
  title: { fontSize: rf(FONT_SIZES.titleLarge), fontWeight: '700', flex: 1, textAlign: 'center' },
  studyRow: {
    flexDirection: 'row',
    gap: rs(SPACING.md),
    marginBottom: rs(SPACING.md),
  },
  studyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(SPACING.sm),
    paddingVertical: rs(SPACING.md),
    borderRadius: rr(RADIUS.lg),
  },
  studyBtnText: { color: '#FFF', fontSize: rf(FONT_SIZES.body), fontWeight: '600' },
  list: { paddingTop: rs(SPACING.sm) },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    marginBottom: rs(SPACING.sm),
    borderWidth: 0.5,
  },
  cardContent: { flex: 1, marginRight: rs(SPACING.sm) },
  cardFront: { fontSize: rf(FONT_SIZES.body), fontWeight: '600' },
  cardBack: { fontSize: rf(FONT_SIZES.small), marginTop: rs(SPACING.xxs) },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(SPACING.sm), marginTop: rs(SPACING.xs) },
  dueTag: { paddingHorizontal: rs(SPACING.sm), paddingVertical: rs(2), borderRadius: rr(RADIUS.xs) },
  dueTagText: { fontSize: rf(FONT_SIZES.caption), fontWeight: '600' },
  reviewCount: { fontSize: rf(FONT_SIZES.caption) },
  empty: { alignItems: 'center', marginTop: rs(80), gap: rs(SPACING.sm) },
  emptyTitle: { fontSize: rf(FONT_SIZES.title), fontWeight: '600' },
  emptyDesc: { fontSize: rf(FONT_SIZES.body) },
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
