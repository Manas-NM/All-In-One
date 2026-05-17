import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DrawingCanvas from '../components/DrawingCanvas';
import { useNotesStore } from '../store/notesStore';
import { exportNoteToPdf } from '../services/storage';
import { getNoteById } from '../services/database';
import { Stroke, NotesStackParamList } from '../types';
import {
  COLORS,
  NOTE_CARD_COLORS,
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
  getCanvasDimensions,
} from '../utils/responsive';

type EditorRoute = RouteProp<NotesStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditorRoute>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { createNote, updateNote } = useNotesStore();

  const noteId = route.params?.noteId;
  const isNew = !noteId;

  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [noteColor, setNoteColor] = useState<string>(
    NOTE_CARD_COLORS[Math.floor(Math.random() * NOTE_CARD_COLORS.length)]
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasChanges = useRef(false);

  useEffect(() => {
    if (noteId) {
      loadNote();
    } else {
      setIsLoaded(true);
    }
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) return;
    try {
      const note = await getNoteById(noteId);
      if (note) {
        setTitle(note.title);
        setTextContent(note.textContent);
        setNoteColor(note.color);
        try {
          const parsed = JSON.parse(note.content);
          if (Array.isArray(parsed)) setStrokes(parsed);
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    }
    setIsLoaded(true);
  };

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim() || 'Untitled Note';
    const content = JSON.stringify(strokes);

    try {
      if (isNew) {
        await createNote({
          title: trimmedTitle,
          content,
          textContent: textContent.trim(),
          color: noteColor,
          isFavorite: false,
        });
      } else if (noteId) {
        await updateNote(noteId, {
          title: trimmedTitle,
          content,
          textContent: textContent.trim(),
          color: noteColor,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  }, [title, textContent, strokes, noteColor, isNew, noteId]);

  const handleExportPdf = async () => {
    try {
      const { width, height } = getCanvasDimensions();
      await exportNoteToPdf(
        title.trim() || 'Untitled Note',
        textContent,
        strokes,
        width,
        height
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export PDF.');
    }
  };

  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    hasChanges.current = true;
  };

  const headerTopPadding = Math.max(insets.top, rs(8)) + rs(4);
  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textSecondary, fontSize: rf(FONT_SIZES.body) }}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            paddingTop: headerTopPadding,
            paddingHorizontal: rs(SPACING.md),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={ri(24)} color={COLORS.primary} />
          <Text style={[styles.backText, { color: COLORS.primary }]}>Notes</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowColorPicker(!showColorPicker)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.colorIndicator, { backgroundColor: noteColor }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExportPdf}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={ri(20)} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color picker row */}
      {showColorPicker && (
        <View
          style={[
            styles.colorPicker,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          {NOTE_CARD_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                noteColor === color && styles.colorOptionActive,
              ]}
              onPress={() => {
                setNoteColor(color);
                setShowColorPicker(false);
              }}
            />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: insets.bottom + rs(100),
          alignSelf: 'center',
          width: '100%',
          maxWidth: maxContentWidth,
        }}
      >
        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: theme.text }]}
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            hasChanges.current = true;
          }}
          placeholder="Note title"
          placeholderTextColor={theme.textTertiary}
        />

        {/* Drawing Canvas */}
        <View style={styles.canvasSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            DRAWING
          </Text>
          <DrawingCanvas
            initialStrokes={strokes}
            onStrokesChange={handleStrokesChange}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            TEXT NOTES
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={textContent}
            onChangeText={(t) => {
              setTextContent(t);
              hasChanges.current = true;
            }}
            placeholder="Type your notes here..."
            placeholderTextColor={theme.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(SPACING.sm + 2),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: rf(FONT_SIZES.subtitle),
    marginLeft: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.sm),
  },
  headerButton: {
    padding: rs(SPACING.sm),
  },
  colorIndicator: {
    width: ri(22),
    height: ri(22),
    borderRadius: ri(22) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.sm),
    borderRadius: rr(RADIUS.sm),
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: rf(FONT_SIZES.body),
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: rs(SPACING.md),
    paddingVertical: rs(SPACING.md),
    paddingHorizontal: rs(SPACING.md),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorOption: {
    width: ri(28),
    height: ri(28),
    borderRadius: ri(28) / 2,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  titleInput: {
    paddingVertical: rs(SPACING.lg),
    fontSize: rf(FONT_SIZES.heading),
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: rs(SPACING.sm),
  },
  canvasSection: {
    marginBottom: rs(SPACING.xl),
  },
  textSection: {
    marginBottom: rs(SPACING.xl),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md + 2),
    fontSize: rf(FONT_SIZES.bodyLarge),
    lineHeight: rf(FONT_SIZES.bodyLarge) * 1.45,
    minHeight: rs(120),
  },
});
