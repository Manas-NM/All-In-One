import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitFrequency } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS, HABIT_COLORS, HABIT_ICONS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

interface HabitFormProps {
  visible: boolean;
  habit?: Habit; // for editing
  onClose: () => void;
  onSubmit: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
}

export default function HabitForm({ visible, habit, onClose, onSubmit }: HabitFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetDays, setTargetDays] = useState(7);
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0].name);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description);
      setFrequency(habit.frequency);
      setTargetDays(habit.targetDays);
      setColor(habit.color);
      setIcon(habit.icon);
    } else {
      setName('');
      setDescription('');
      setFrequency('daily');
      setTargetDays(7);
      setColor(HABIT_COLORS[0]);
      setIcon(HABIT_ICONS[0].name);
    }
  }, [habit, visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      frequency,
      color,
      icon,
      targetDays: frequency === 'daily' ? 7 : targetDays,
    });
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
            {habit ? 'Edit Habit' : 'New Habit'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!name.trim()}>
            <Text
              style={[
                styles.headerBtn,
                { color: name.trim() ? COLORS.primary : theme.textTertiary },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(40) }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Study 2 hours"
            placeholderTextColor={theme.textTertiary}
          />

          {/* Description */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMulti, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={theme.textTertiary}
            multiline
          />

          {/* Frequency */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
          <View style={styles.freqRow}>
            {(['daily', 'weekly'] as HabitFrequency[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.freqBtn,
                  {
                    backgroundColor: frequency === f ? COLORS.primary : theme.surface,
                    borderColor: frequency === f ? COLORS.primary : theme.border,
                  },
                ]}
                onPress={() => setFrequency(f)}
              >
                <Text
                  style={[
                    styles.freqText,
                    { color: frequency === f ? '#FFF' : theme.text },
                  ]}
                >
                  {f === 'daily' ? 'Daily' : 'Weekly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target days (only for weekly) */}
          {frequency === 'weekly' && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Target days per week
              </Text>
              <View style={styles.targetRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.targetBtn,
                      {
                        backgroundColor: targetDays === n ? COLORS.primary : theme.surface,
                        borderColor: targetDays === n ? COLORS.primary : theme.border,
                      },
                    ]}
                    onPress={() => setTargetDays(n)}
                  >
                    <Text
                      style={[
                        styles.targetText,
                        { color: targetDays === n ? '#FFF' : theme.text },
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Color picker */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: '#FFF',
                  },
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={ri(14)} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon picker */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic.name}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: icon === ic.name ? color + '30' : theme.surface,
                    borderColor: icon === ic.name ? color : theme.border,
                  },
                ]}
                onPress={() => setIcon(ic.name)}
              >
                <Ionicons
                  name={ic.name as any}
                  size={ri(20)}
                  color={icon === ic.name ? color : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.iconLabel,
                    { color: icon === ic.name ? color : theme.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {ic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  },
  inputMulti: {
    minHeight: rs(80),
    textAlignVertical: 'top',
  },
  freqRow: {
    flexDirection: 'row',
    gap: rs(SPACING.md),
  },
  freqBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    alignItems: 'center',
  },
  freqText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  targetRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
  },
  targetBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: rr(RADIUS.sm),
    paddingVertical: rs(SPACING.sm),
    alignItems: 'center',
  },
  targetText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: rs(SPACING.md),
    flexWrap: 'wrap',
  },
  colorDot: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(SPACING.sm),
  },
  iconBtn: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.sm),
    alignItems: 'center',
    width: rs(72),
  },
  iconLabel: {
    fontSize: rf(FONT_SIZES.caption),
    marginTop: rs(SPACING.xxs),
  },
});
