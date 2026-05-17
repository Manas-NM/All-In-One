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
import { Task, TaskPriority, Subject, Note } from '../types';
import {
  COLORS,
  PRIORITY_CONFIG,
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

interface TaskFormProps {
  visible: boolean;
  task?: Task | null;
  subjects: Subject[];
  notes: Note[];
  defaultNoteId?: string | null;
  defaultSubjectId?: string | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    dueDate: number | null;
    priority: TaskPriority;
    noteId: string | null;
    subjectId: string | null;
  }) => void;
}

export default function TaskForm({
  visible,
  task,
  subjects,
  notes,
  defaultNoteId,
  defaultSubjectId,
  onClose,
  onSave,
}: TaskFormProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : ''
      );
      setNoteId(task.noteId);
      setSubjectId(task.subjectId);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setNoteId(defaultNoteId ?? null);
      setSubjectId(defaultSubjectId ?? null);
    }
    setShowNotes(false);
    setShowSubjects(false);
  }, [task, visible, defaultNoteId, defaultSubjectId]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    let parsedDate: number | null = null;
    if (dueDate) {
      const d = new Date(dueDate + 'T23:59:59');
      if (!isNaN(d.getTime())) parsedDate = d.getTime();
    }

    onSave({
      title: trimmed,
      description: description.trim(),
      dueDate: parsedDate,
      priority,
      noteId,
      subjectId,
    });
    onClose();
  };

  const selectedNote = notes.find((n) => n.id === noteId);
  const selectedSubject = subjects.find((s) => s.id === subjectId);
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
                {task ? 'Edit Task' : 'New Task'}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={!title.trim()}>
                <Text
                  style={[
                    styles.saveText,
                    { color: title.trim() ? COLORS.primary : theme.textTertiary },
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              TITLE
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />

            {/* Description */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              DESCRIPTION
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multiInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor={theme.textTertiary}
              multiline
              textAlignVertical="top"
            />

            {/* Due Date */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              DUE DATE
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numbers-and-punctuation"
            />

            {/* Priority */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              PRIORITY
            </Text>
            <View style={styles.priorityRow}>
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
                const conf = PRIORITY_CONFIG[p];
                const selected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: selected
                          ? conf.color + '20'
                          : theme.surface,
                        borderColor: selected ? conf.color : theme.border,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: conf.color }]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: selected ? conf.color : theme.textSecondary },
                      ]}
                    >
                      {conf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Link to Subject */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              SUBJECT (OPTIONAL)
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowSubjects(!showSubjects)}
            >
              {selectedSubject ? (
                <View style={styles.dropdownContent}>
                  <View
                    style={[
                      styles.dropdownDot,
                      { backgroundColor: selectedSubject.color },
                    ]}
                  />
                  <Text style={[styles.dropdownText, { color: theme.text }]}>
                    {selectedSubject.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.dropdownText, { color: theme.textTertiary }]}>
                  None
                </Text>
              )}
              <Ionicons
                name="chevron-down"
                size={ri(16)}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
            {showSubjects && (
              <View
                style={[
                  styles.dropdownList,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSubjectId(null);
                    setShowSubjects(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.textSecondary }]}>
                    None
                  </Text>
                </TouchableOpacity>
                {subjects.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSubjectId(s.id);
                      setShowSubjects(false);
                    }}
                  >
                    <View
                      style={[styles.dropdownDot, { backgroundColor: s.color }]}
                    />
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Link to Note */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              LINKED NOTE (OPTIONAL)
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowNotes(!showNotes)}
            >
              {selectedNote ? (
                <Text
                  style={[styles.dropdownText, { color: theme.text }]}
                  numberOfLines={1}
                >
                  📝 {selectedNote.title || 'Untitled'}
                </Text>
              ) : (
                <Text style={[styles.dropdownText, { color: theme.textTertiary }]}>
                  None
                </Text>
              )}
              <Ionicons
                name="chevron-down"
                size={ri(16)}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
            {showNotes && (
              <View
                style={[
                  styles.dropdownList,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setNoteId(null);
                    setShowNotes(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.textSecondary }]}>
                    None
                  </Text>
                </TouchableOpacity>
                {notes.slice(0, 20).map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setNoteId(n.id);
                      setShowNotes(false);
                    }}
                  >
                    <Text
                      style={[styles.dropdownItemText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {n.title || 'Untitled'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    maxHeight: '90%',
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
  label: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: rs(SPACING.sm),
    marginTop: rs(SPACING.lg),
  },
  input: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.bodyLarge),
  },
  multiInput: {
    minHeight: rs(60),
  },
  priorityRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: rr(RADIUS.md),
    paddingVertical: rs(SPACING.sm + 2),
    gap: rs(SPACING.xs),
  },
  priorityDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
  },
  priorityText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    marginRight: rs(SPACING.sm),
  },
  dropdownText: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    marginTop: rs(SPACING.xs),
    maxHeight: rs(180),
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(SPACING.sm + 2),
    paddingHorizontal: rs(SPACING.md),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  dropdownItemText: {
    fontSize: rf(FONT_SIZES.body),
  },
});
