import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../types';
import {
  COLORS,
  SUBJECT_COLORS,
  SUBJECT_ICONS,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from '../utils/constants';
import {
  rf,
  rs,
  rr,
  ri,
  getScreenHorizontalPadding,
  getMaxContentWidth,
} from '../utils/responsive';

interface SubjectFormProps {
  visible: boolean;
  subject?: Subject | null;
  onClose: () => void;
  onSave: (data: { name: string; color: string; icon: string }) => void;
}

export default function SubjectForm({
  visible,
  subject,
  onClose,
  onSave,
}: SubjectFormProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState<string>(SUBJECT_ICONS[0].name);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setColor(subject.color);
      setIcon(subject.icon);
    } else {
      setName('');
      setColor(SUBJECT_COLORS[0]);
      setIcon(SUBJECT_ICONS[0].name);
    }
  }, [subject, visible]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color, icon });
    onClose();
  };

  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + rs(SPACING.lg),
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              alignSelf: 'center',
              width: '100%',
              maxWidth: maxContentWidth,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.cancelText, { color: COLORS.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {subject ? 'Edit Subject' : 'New Subject'}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={!name.trim()}>
                <Text
                  style={[
                    styles.saveText,
                    { color: name.trim() ? COLORS.primary : theme.textTertiary },
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={[styles.preview, { backgroundColor: color + '20' }]}>
              <View style={[styles.previewIcon, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={ri(24)} color="#FFF" />
              </View>
              <Text
                style={[styles.previewName, { color: theme.text }]}
                numberOfLines={1}
              >
                {name || 'Subject Name'}
              </Text>
            </View>

            {/* Name Input */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>NAME</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mathematics, History..."
              placeholderTextColor={theme.textTertiary}
              autoFocus
              maxLength={30}
            />

            {/* Color Picker */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>COLOR</Text>
            <View style={styles.colorGrid}>
              {SUBJECT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={ri(16)} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon Picker */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>ICON</Text>
            <View style={styles.iconGrid}>
              {SUBJECT_ICONS.map((i) => (
                <TouchableOpacity
                  key={i.name}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        icon === i.name ? color + '20' : theme.surface,
                      borderColor: icon === i.name ? color : theme.border,
                    },
                  ]}
                  onPress={() => setIcon(i.name)}
                >
                  <Ionicons
                    name={i.name as any}
                    size={ri(20)}
                    color={icon === i.name ? color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      {
                        color: icon === i.name ? color : theme.textSecondary,
                      },
                    ]}
                  >
                    {i.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    borderTopLeftRadius: rr(RADIUS.xxl),
    borderTopRightRadius: rr(RADIUS.xxl),
    paddingTop: rs(SPACING.md),
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(SPACING.md),
  },
  cancelText: {
    fontSize: rf(FONT_SIZES.subtitle),
  },
  headerTitle: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
  },
  saveText: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.lg),
    marginVertical: rs(SPACING.lg),
  },
  previewIcon: {
    width: ri(44),
    height: ri(44),
    borderRadius: rr(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.md),
  },
  previewName: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: rs(SPACING.sm),
    marginTop: rs(SPACING.md),
  },
  input: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.bodyLarge),
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(SPACING.md),
  },
  colorOption: {
    width: ri(40),
    height: ri(40),
    borderRadius: ri(40) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(SPACING.sm),
    marginBottom: rs(SPACING.lg),
  },
  iconOption: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: rr(RADIUS.md),
    paddingVertical: rs(SPACING.sm),
    paddingHorizontal: rs(SPACING.md),
    minWidth: ri(70),
  },
  iconLabel: {
    fontSize: rf(FONT_SIZES.caption),
    marginTop: rs(2),
  },
});
