import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateFlashcards } from '../services/aiService';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

interface GeneratedCard {
  front: string;
  back: string;
}

interface FlashcardGeneratorProps {
  visible: boolean;
  noteTitle: string;
  noteContent: string;
  onClose: () => void;
  onSave: (cards: GeneratedCard[]) => void;
}

export default function FlashcardGenerator({
  visible,
  noteTitle,
  noteContent,
  onClose,
  onSave,
}: FlashcardGeneratorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateFlashcards(noteTitle, noteContent);
      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('cards' in result && result.cards) {
        setCards(result.cards);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate flashcards');
    }
    setIsLoading(false);
  };

  const handleEditCard = (index: number, field: 'front' | 'back', value: string) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const valid = cards.filter((c) => c.front.trim() && c.back.trim());
    if (valid.length === 0) {
      Alert.alert('No Cards', 'No valid cards to save.');
      return;
    }
    onSave(valid);
    setCards([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: COLORS.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Generate Flashcards</Text>
          {cards.length > 0 ? (
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.headerBtn, { color: COLORS.primary }]}>Save</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: rs(60) }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(40) }]}
          keyboardShouldPersistTaps="handled"
        >
          {cards.length === 0 && !isLoading && (
            <View style={styles.generateSection}>
              <Ionicons name="sparkles" size={ri(48)} color={COLORS.primary} />
              <Text style={[styles.generateTitle, { color: theme.text }]}>
                AI Flashcard Generator
              </Text>
              <Text style={[styles.generateDesc, { color: theme.textSecondary }]}>
                Generate flashcards from your note content using AI. You can edit them before saving.
              </Text>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: COLORS.error + '15' }]}>
                  <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.generateBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleGenerate}
              >
                <Ionicons name="sparkles" size={ri(18)} color="#FFF" />
                <Text style={styles.generateBtnText}>Generate Flashcards with AI</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Generating flashcards...
              </Text>
            </View>
          )}

          {cards.length > 0 && (
            <>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                Preview ({cards.length} cards)
              </Text>

              {cards.map((card, index) => (
                <View
                  key={index}
                  style={[styles.cardPreview, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardNum, { color: COLORS.primary }]}>#{index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveCard(index)}>
                      <Ionicons name="close-circle" size={ri(20)} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.textTertiary }]}>Q:</Text>
                  <TextInput
                    style={[styles.cardInput, { color: theme.text, borderColor: theme.border }]}
                    value={card.front}
                    onChangeText={(v) => handleEditCard(index, 'front', v)}
                    multiline
                  />

                  <Text style={[styles.fieldLabel, { color: theme.textTertiary }]}>A:</Text>
                  <TextInput
                    style={[styles.cardInput, { color: theme.text, borderColor: theme.border }]}
                    value={card.back}
                    onChangeText={(v) => handleEditCard(index, 'back', v)}
                    multiline
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.regenerateBtn, { borderColor: COLORS.primary }]}
                onPress={handleGenerate}
              >
                <Text style={[styles.regenerateBtnText, { color: COLORS.primary }]}>
                  Regenerate
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.md),
    borderBottomWidth: 0.5,
  },
  headerBtn: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '500' },
  headerTitle: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '700' },
  content: { padding: getScreenHorizontalPadding(), paddingTop: rs(SPACING.xl) },
  generateSection: { alignItems: 'center', marginTop: rs(40), gap: rs(SPACING.md) },
  generateTitle: { fontSize: rf(FONT_SIZES.titleLarge), fontWeight: '700' },
  generateDesc: { fontSize: rf(FONT_SIZES.body), textAlign: 'center', paddingHorizontal: rs(SPACING.xl) },
  errorBox: { padding: rs(SPACING.md), borderRadius: rr(RADIUS.md), width: '100%' },
  errorText: { fontSize: rf(FONT_SIZES.body), textAlign: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.sm),
    paddingVertical: rs(SPACING.md),
    paddingHorizontal: rs(SPACING.xl),
    borderRadius: rr(RADIUS.lg),
    marginTop: rs(SPACING.md),
  },
  generateBtnText: { color: '#FFF', fontSize: rf(FONT_SIZES.subtitle), fontWeight: '600' },
  loadingSection: { alignItems: 'center', marginTop: rs(80), gap: rs(SPACING.md) },
  loadingText: { fontSize: rf(FONT_SIZES.body) },
  previewTitle: { fontSize: rf(FONT_SIZES.title), fontWeight: '700', marginBottom: rs(SPACING.md) },
  cardPreview: { borderRadius: rr(RADIUS.lg), borderWidth: 0.5, padding: rs(SPACING.md), marginBottom: rs(SPACING.md) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(SPACING.sm) },
  cardNum: { fontSize: rf(FONT_SIZES.body), fontWeight: '700' },
  fieldLabel: { fontSize: rf(FONT_SIZES.small), fontWeight: '600', marginBottom: rs(SPACING.xxs) },
  cardInput: {
    borderBottomWidth: 0.5,
    fontSize: rf(FONT_SIZES.body),
    paddingVertical: rs(SPACING.sm),
    marginBottom: rs(SPACING.sm),
  },
  regenerateBtn: {
    borderWidth: 1.5,
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md),
    alignItems: 'center',
    marginTop: rs(SPACING.md),
  },
  regenerateBtnText: { fontSize: rf(FONT_SIZES.subtitle), fontWeight: '600' },
});
