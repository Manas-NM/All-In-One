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
import { Ionicons } from '@expo/vector-icons';
import DrawingCanvas from '../components/DrawingCanvas';
import { useNotesStore } from '../store/notesStore';
import { exportNoteToPdf } from '../services/storage';
import { getNoteById } from '../services/database';
import { Stroke, NotesStackParamList } from '../types';
import { COLORS, NOTE_CARD_COLORS } from '../utils/constants';

type EditorRoute = RouteProp<NotesStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditorRoute>();
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
      await exportNoteToPdf(
        title.trim() || 'Untitled Note',
        textContent,
        strokes,
        400,
        400
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export PDF.');
    }
  };

  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    hasChanges.current = true;
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading...</Text>
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={[styles.backText, { color: COLORS.primary }]}>Notes</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowColorPicker(!showColorPicker)}
          >
            <View style={[styles.colorIndicator, { backgroundColor: noteColor }]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleExportPdf}>
            <Ionicons name="share-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color picker row */}
      {showColorPicker && (
        <View style={[styles.colorPicker, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
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
            canvasHeight={350}
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

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  colorIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    paddingHorizontal: 16,
  },
  titleInput: {
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  canvasSection: {
    marginBottom: 20,
  },
  textSection: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
  },
});
