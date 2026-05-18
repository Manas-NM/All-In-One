import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcardsStore } from '../store/flashcardsStore';
import { Flashcard, NotesStackParamList } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS, QUALITY_LABELS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

type RoutePropType = RouteProp<NotesStackParamList, 'FlashcardStudy'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function FlashcardStudyScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { deckId, studyAll } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const { reviewCard, getDueCards, getAllCards } = useFlashcardsStore();

  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Animation for flip
  const flipAnim = useRef(new Animated.Value(0)).current;
  // Animation for swipe
  const panX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStudyCards();
  }, []);

  const loadStudyCards = async () => {
    const cards = studyAll ? await getAllCards(deckId) : await getDueCards(deckId);
    // Shuffle
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    if (shuffled.length === 0) setIsComplete(true);
  };

  const currentCard = studyCards[currentIndex];

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (quality: number) => {
    if (!currentCard) return;
    await reviewCard(currentCard.id, quality);
    goToNext();
  };

  const goToNext = () => {
    // Reset flip
    flipAnim.setValue(0);
    setIsFlipped(false);
    panX.setValue(0);

    if (currentIndex + 1 >= studyCards.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        panX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          // Swiped right = Easy
          Animated.timing(panX, { toValue: SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
            handleRate(4);
          });
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          // Swiped left = Hard
          Animated.timing(panX, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
            handleRate(1);
          });
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const horizontalPadding = getScreenHorizontalPadding();

  if (isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.completeContainer, { paddingTop: insets.top }]}>
          <Ionicons name="checkmark-circle" size={ri(80)} color={COLORS.success} />
          <Text style={[styles.completeTitle, { color: theme.text }]}>Session Complete!</Text>
          <Text style={[styles.completeDesc, { color: theme.textSecondary }]}>
            You reviewed {studyCards.length} card{studyCards.length !== 1 ? 's' : ''}.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + rs(SPACING.sm), paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={ri(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.progress, { color: theme.textSecondary }]}>
          {currentIndex + 1} / {studyCards.length}
        </Text>
        <View style={{ width: ri(24) }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.surfaceSecondary, marginHorizontal: horizontalPadding }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentIndex + 1) / studyCards.length) * 100}%`,
              backgroundColor: COLORS.primary,
            },
          ]}
        />
      </View>

      {/* Swipe hint */}
      <View style={[styles.swipeHint, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.swipeLabel, { color: COLORS.error }]}>← Hard</Text>
        <Text style={[styles.swipeLabel, { color: theme.textTertiary }]}>Tap to flip</Text>
        <Text style={[styles.swipeLabel, { color: COLORS.success }]}>Easy →</Text>
      </View>

      {/* Flashcard */}
      {currentCard && (
        <View style={styles.cardArea}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.cardOuter,
              {
                transform: [{ translateX: panX }],
              },
            ]}
          >
            {/* Front */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <TouchableOpacity style={styles.cardTouchable} onPress={flipCard} activeOpacity={0.9}>
                <Text style={[styles.cardSide, { color: theme.textTertiary }]}>QUESTION</Text>
                <Text style={[styles.cardText, { color: theme.text }]}>{currentCard.front}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Back */}
            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
                  backfaceVisibility: 'hidden',
                },
              ]}
            >
              <TouchableOpacity style={styles.cardTouchable} onPress={flipCard} activeOpacity={0.9}>
                <Text style={[styles.cardSide, { color: COLORS.success }]}>ANSWER</Text>
                <Text style={[styles.cardText, { color: theme.text }]}>{currentCard.back}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      )}

      {/* Rating buttons (visible when flipped) */}
      {isFlipped && (
        <View style={[styles.ratingRow, { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + rs(SPACING.lg) }]}>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: COLORS.error }]}
            onPress={() => handleRate(0)}
          >
            <Text style={styles.rateBtnText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: '#FD79A8' }]}
            onPress={() => handleRate(2)}
          >
            <Text style={styles.rateBtnText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: '#74B9FF' }]}
            onPress={() => handleRate(3)}
          >
            <Text style={styles.rateBtnText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: COLORS.success }]}
            onPress={() => handleRate(5)}
          >
            <Text style={styles.rateBtnText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: rs(SPACING.md),
  },
  progress: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '600' },
  progressBar: { height: rs(4), borderRadius: rs(2), overflow: 'hidden', marginBottom: rs(SPACING.md) },
  progressFill: { height: '100%', borderRadius: rs(2) },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rs(SPACING.md),
  },
  swipeLabel: { fontSize: rf(FONT_SIZES.small), fontWeight: '500' },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.xl),
  },
  cardOuter: {
    width: '100%',
    aspectRatio: 0.7,
    maxHeight: 400,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: rr(RADIUS.xxl),
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBack: {
    // Same position, just rotated via animation
  },
  cardTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(SPACING.xxl),
  },
  cardSide: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: rs(SPACING.lg),
  },
  cardText: {
    fontSize: rf(FONT_SIZES.titleLarge),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: rf(FONT_SIZES.titleLarge) * 1.5,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    justifyContent: 'center',
  },
  rateBtn: {
    flex: 1,
    paddingVertical: rs(SPACING.md),
    borderRadius: rr(RADIUS.md),
    alignItems: 'center',
  },
  rateBtnText: { color: '#FFF', fontSize: rf(FONT_SIZES.body), fontWeight: '600' },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: rs(SPACING.lg),
  },
  completeTitle: { fontSize: rf(FONT_SIZES.heading), fontWeight: '700' },
  completeDesc: { fontSize: rf(FONT_SIZES.subtitle) },
  doneBtn: {
    paddingHorizontal: rs(SPACING.xxxl),
    paddingVertical: rs(SPACING.md),
    borderRadius: rr(RADIUS.lg),
    marginTop: rs(SPACING.lg),
  },
  doneBtnText: { color: '#FFF', fontSize: rf(FONT_SIZES.subtitle), fontWeight: '600' },
});
