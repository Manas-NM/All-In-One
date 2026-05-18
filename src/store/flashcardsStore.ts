import { create } from 'zustand';
import { FlashcardDeck, Flashcard, FlashcardReview } from '../types';
import * as db from '../services/database';

// ─── SM-2 Spaced Repetition Algorithm ───────────────────────────

const ONE_DAY_MS = 86400000;

/**
 * Simplified SM-2 algorithm.
 * quality: 0-5 (0=Again, 1=Hard, 2=Hard, 3=Good, 4=Easy, 5=Easy)
 */
function calculateNextReview(
  quality: number,
  currentEaseFactor: number,
  currentInterval: number,
  reviewCount: number
): { nextReviewDate: number; easeFactor: number; interval: number; difficulty: number } {
  let newEF = currentEaseFactor;
  let newInterval: number;

  if (quality < 3) {
    // Failed — reset interval
    newInterval = quality === 0 ? 1 : quality === 1 ? 1 : 3;
  } else {
    // Passed — increase interval
    if (reviewCount === 0) {
      newInterval = 1;
    } else if (reviewCount === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(currentInterval * newEF);
    }
  }

  // Update ease factor (SM-2 formula)
  newEF = newEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  // Map quality to difficulty (1-5)
  const difficulty = Math.max(1, Math.min(5, Math.round((5 - quality) + 1)));

  const nextReviewDate = Date.now() + newInterval * ONE_DAY_MS;

  return { nextReviewDate, easeFactor: newEF, interval: newInterval, difficulty };
}

// ─── Store ──────────────────────────────────────────────────────

interface DeckInfo {
  deck: FlashcardDeck;
  cardCount: number;
  dueCount: number;
}

interface FlashcardsState {
  decks: FlashcardDeck[];
  deckInfoMap: Record<string, { cardCount: number; dueCount: number }>;
  cards: Record<string, Flashcard[]>; // deckId -> cards
  isLoading: boolean;

  loadDecks: () => Promise<void>;
  createDeck: (deck: Omit<FlashcardDeck, 'id' | 'createdAt'>) => Promise<FlashcardDeck>;
  updateDeck: (id: string, updates: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;

  loadCards: (deckId: string) => Promise<void>;
  addCard: (card: Omit<Flashcard, 'id' | 'createdAt'>) => Promise<Flashcard>;
  updateCard: (id: string, updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCard: (id: string, deckId: string) => Promise<void>;

  reviewCard: (cardId: string, quality: number) => Promise<void>;
  getDueCards: (deckId: string) => Promise<Flashcard[]>;
  getAllCards: (deckId: string) => Promise<Flashcard[]>;

  addBulkCards: (deckId: string, cards: { front: string; back: string }[]) => Promise<void>;
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
  decks: [],
  deckInfoMap: {},
  cards: {},
  isLoading: false,

  loadDecks: async () => {
    set({ isLoading: true });
    try {
      const decks = await db.getAllDecks();
      const infoMap: Record<string, { cardCount: number; dueCount: number }> = {};

      for (const deck of decks) {
        const [cardCount, dueCount] = await Promise.all([
          db.getCardCountByDeck(deck.id),
          db.getDueCardCountByDeck(deck.id),
        ]);
        infoMap[deck.id] = { cardCount, dueCount };
      }

      set({ decks, deckInfoMap: infoMap, isLoading: false });
    } catch (error) {
      console.error('Failed to load decks:', error);
      set({ isLoading: false });
    }
  },

  createDeck: async (input) => {
    const deck = await db.createDeck(input);
    set((state) => ({
      decks: [deck, ...state.decks],
      deckInfoMap: { ...state.deckInfoMap, [deck.id]: { cardCount: 0, dueCount: 0 } },
    }));
    return deck;
  },

  updateDeck: async (id, updates) => {
    await db.updateDeck(id, updates);
    set((state) => ({
      decks: state.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  deleteDeck: async (id) => {
    await db.deleteDeck(id);
    set((state) => {
      const newInfoMap = { ...state.deckInfoMap };
      delete newInfoMap[id];
      const newCards = { ...state.cards };
      delete newCards[id];
      return {
        decks: state.decks.filter((d) => d.id !== id),
        deckInfoMap: newInfoMap,
        cards: newCards,
      };
    });
  },

  loadCards: async (deckId) => {
    try {
      const cards = await db.getCardsByDeck(deckId);
      set((state) => ({
        cards: { ...state.cards, [deckId]: cards },
      }));
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  },

  addCard: async (input) => {
    const card = await db.createCard(input);
    set((state) => {
      const deckCards = state.cards[card.deckId] ?? [];
      const info = state.deckInfoMap[card.deckId] ?? { cardCount: 0, dueCount: 0 };
      return {
        cards: { ...state.cards, [card.deckId]: [...deckCards, card] },
        deckInfoMap: {
          ...state.deckInfoMap,
          [card.deckId]: {
            cardCount: info.cardCount + 1,
            dueCount: card.nextReviewDate <= Date.now() ? info.dueCount + 1 : info.dueCount,
          },
        },
      };
    });
    return card;
  },

  updateCard: async (id, updates) => {
    await db.updateCard(id, updates);
    set((state) => {
      const newCards = { ...state.cards };
      for (const deckId of Object.keys(newCards)) {
        newCards[deckId] = newCards[deckId].map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
      }
      return { cards: newCards };
    });
  },

  deleteCard: async (id, deckId) => {
    await db.deleteCard(id);
    set((state) => {
      const deckCards = (state.cards[deckId] ?? []).filter((c) => c.id !== id);
      const info = state.deckInfoMap[deckId] ?? { cardCount: 0, dueCount: 0 };
      return {
        cards: { ...state.cards, [deckId]: deckCards },
        deckInfoMap: {
          ...state.deckInfoMap,
          [deckId]: { cardCount: Math.max(0, info.cardCount - 1), dueCount: Math.max(0, info.dueCount) },
        },
      };
    });
  },

  reviewCard: async (cardId: string, quality: number) => {
    // Find the card
    let card: Flashcard | undefined;
    let foundDeckId = '';
    const allCards = get().cards;
    for (const deckId of Object.keys(allCards)) {
      const found = allCards[deckId].find((c) => c.id === cardId);
      if (found) {
        card = found;
        foundDeckId = deckId;
        break;
      }
    }
    if (!card) return;

    const { nextReviewDate, easeFactor, interval, difficulty } = calculateNextReview(
      quality,
      card.easeFactor,
      card.interval,
      card.reviewCount
    );

    const updates = {
      nextReviewDate,
      easeFactor,
      interval,
      difficulty,
      reviewCount: card.reviewCount + 1,
    };

    await db.updateCard(cardId, updates);
    await db.createReview({
      flashcardId: cardId,
      quality,
      reviewedAt: Date.now(),
    });

    set((state) => {
      const deckCards = (state.cards[foundDeckId] ?? []).map((c) =>
        c.id === cardId ? { ...c, ...updates } : c
      );
      return {
        cards: { ...state.cards, [foundDeckId]: deckCards },
      };
    });
  },

  getDueCards: async (deckId) => {
    return db.getDueCardsByDeck(deckId);
  },

  getAllCards: async (deckId) => {
    return db.getCardsByDeck(deckId);
  },

  addBulkCards: async (deckId, cardInputs) => {
    const now = Date.now();
    const newCards: Flashcard[] = [];

    for (const input of cardInputs) {
      const card = await db.createCard({
        deckId,
        front: input.front,
        back: input.back,
        difficulty: 1,
        nextReviewDate: now, // due immediately
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
      });
      newCards.push(card);
    }

    set((state) => {
      const deckCards = state.cards[deckId] ?? [];
      const info = state.deckInfoMap[deckId] ?? { cardCount: 0, dueCount: 0 };
      return {
        cards: { ...state.cards, [deckId]: [...deckCards, ...newCards] },
        deckInfoMap: {
          ...state.deckInfoMap,
          [deckId]: {
            cardCount: info.cardCount + newCards.length,
            dueCount: info.dueCount + newCards.length,
          },
        },
      };
    });
  },
}));
