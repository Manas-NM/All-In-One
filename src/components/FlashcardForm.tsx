import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, getScreenHorizontalPadding } from '../utils/responsive';

interface FlashcardFormProps {
  visible: boolean;
  initialFront?: string;
  initialBack?: string;
  onClose: () => void;
  onSubmit: (front: string, back: string) => void;
}

export default function FlashcardForm({
  visible,
  initialFront = '',
  initialBack = '',
  onClose,
  onSubmit,
}: FlashcardFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);

  useEffect(() => {
    setFront(initialFront);
    setBack(initialBack);
  }, [initialFront, initialBack, visible]);

  const handleSave = () => {
    if (!front.trim() || !back.trim()) return;
    onSubmit(front.trim(), back.trim());
    setFront('');
    setBack('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: COLORS.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {initialFront ? 'Edit Card' : 'New Card'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!front.trim() || !back.trim()}>
            <Text
              style={[
                styles.headerBtn,
                { color: front.trim() && back.trim() ? COLORS.primary : theme.textTertiary },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>Front (Question)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={front}
            onChangeText={setFront}
            placeholder="Enter question"
            placeholderTextColor={theme.textTertiary}
            multiline
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Back (Answer)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={back}
            onChangeText={setBack}
            placeholder="Enter answer"
            placeholderTextColor={theme.textTertiary}
            multiline
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.md),
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '700',
  },
  content: {
    padding: getScreenHorizontalPadding(),
    paddingTop: rs(SPACING.xl),
  },
  label: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
    marginBottom: rs(SPACING.sm),
    marginTop: rs(SPACING.lg),
  },
  input: {
    borderWidth: 0.5,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.body),
    minHeight: rs(100),
    textAlignVertical: 'top',
  },
});
