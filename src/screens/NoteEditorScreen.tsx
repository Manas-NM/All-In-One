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
  Modal,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DrawingCanvas from '../components/DrawingCanvas';
import TaskForm from '../components/TaskForm';
import FlashcardGenerator from '../components/FlashcardGenerator';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { useNotesStore } from '../store/notesStore';
import { useSubjectsStore } from '../store/subjectsStore';
import { useTasksStore } from '../store/tasksStore';
import { useFlashcardsStore } from '../store/flashcardsStore';
import { exportNoteToPdf } from '../services/storage';
import { getNoteById } from '../services/database';
import { summarizeNote } from '../services/aiService';
import { recognizeTextFromCanvas, strokesToSvg } from '../services/ocrService';
import { printNote } from '../services/printService';
import { Stroke, NotesStackParamList, Subject, Task } from '../types';
import {
  COLORS,
  NOTE_CARD_COLORS,
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
  getCanvasDimensions,
} from '../utils/responsive';

type EditorRoute = RouteProp<NotesStackParamList, 'NoteEditor'>;
type NavProp = NativeStackNavigationProp<NotesStackParamList>;

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<EditorRoute>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { createNote, updateNote } = useNotesStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { tasks, loadTasks } = useTasksStore();

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
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [tempSummary, setTempSummary] = useState<string>('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  // OCR state
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  // Flashcard generator
  const [showFlashcardGen, setShowFlashcardGen] = useState(false);
  // Print
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    includeDrawing: true,
    includeSummary: true,
    includeOcrText: false,
  });

  const hasChanges = useRef(false);

  useEffect(() => {
    loadSubjects();
    loadTasks();
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
        setSubjectId(note.subjectId);
        setAiSummary(note.aiSummary);
        setOcrText(note.ocrText ?? null);
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
          subjectId,
          aiSummary,
          ocrText,
        });
      } else if (noteId) {
        await updateNote(noteId, {
          title: trimmedTitle,
          content,
          textContent: textContent.trim(),
          color: noteColor,
          subjectId,
          aiSummary,
          ocrText,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  }, [title, textContent, strokes, noteColor, isNew, noteId, subjectId, aiSummary, ocrText]);

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

  const handleSummarize = async () => {
    setAiLoading(true);
    setShowAiModal(true);
    setTempSummary('');

    const result = await summarizeNote(title, textContent);

    setAiLoading(false);
    if (result.error) {
      setTempSummary('');
      Alert.alert('AI Error', result.error);
      setShowAiModal(false);
    } else if (result.summary) {
      setTempSummary(result.summary);
    }
  };

  const handleSaveSummary = () => {
    setAiSummary(tempSummary);
    setShowAiModal(false);
    hasChanges.current = true;
  };

  const handleSaveTask = async (data: any) => {
    try {
      await useTasksStore.getState().addTask({
        ...data,
        noteId: noteId ?? null,
        completed: false,
      });
      loadTasks();
    } catch {
      Alert.alert('Error', 'Failed to create task.');
    }
  };

  // ─── OCR ──────────────────────────────────────────────────────

  const handleOcr = async () => {
    if (strokes.length === 0) {
      Alert.alert('No Drawing', 'Draw something on the canvas first to extract text.');
      return;
    }
    setOcrLoading(true);
    setShowOcrModal(true);
    setOcrResult('');

    try {
      // Generate SVG from strokes and convert to a basic base64 representation
      const { width, height } = getCanvasDimensions();
      const svg = strokesToSvg(strokes, width, height);
      // Convert SVG to base64 for the API
      const base64 = btoa(unescape(encodeURIComponent(svg)));

      const result = await recognizeTextFromCanvas(base64);
      setOcrLoading(false);

      if (result.error) {
        setOcrResult('');
        Alert.alert('OCR Error', result.error);
        setShowOcrModal(false);
      } else {
        setOcrResult(result.text);
      }
    } catch (e: any) {
      setOcrLoading(false);
      Alert.alert('OCR Error', e.message || 'Failed to extract text.');
      setShowOcrModal(false);
    }
  };

  const handleSaveOcrText = () => {
    setOcrText(ocrResult);
    setShowOcrModal(false);
    hasChanges.current = true;
  };

  // ─── Flashcard Generation ─────────────────────────────────────

  const handleSaveFlashcards = async (cards: { front: string; back: string }[]) => {
    try {
      const deck = await useFlashcardsStore.getState().createDeck({
        name: `From: ${title.trim() || 'Untitled Note'}`,
        description: `Generated from note`,
        subjectId: subjectId,
        noteId: noteId ?? null,
      });
      await useFlashcardsStore.getState().addBulkCards(deck.id, cards);
      Alert.alert('Success', `Created deck with ${cards.length} flashcards!`);
    } catch {
      Alert.alert('Error', 'Failed to save flashcards.');
    }
  };

  // ─── Print ────────────────────────────────────────────────────

  const handlePrint = async () => {
    setShowPrintModal(false);
    try {
      const note = {
        id: noteId ?? '',
        title: title.trim() || 'Untitled Note',
        content: JSON.stringify(strokes),
        textContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: noteColor,
        isFavorite: false,
        subjectId,
        aiSummary,
        ocrText,
      };
      const { width, height } = getCanvasDimensions();
      await printNote(note, strokes, {
        includeDrawing: printOptions.includeDrawing,
        includeSummary: printOptions.includeSummary,
        includeOcrText: printOptions.includeOcrText,
        canvasWidth: width,
        canvasHeight: height,
      });
    } catch {
      Alert.alert('Print Error', 'Failed to print note.');
    }
  };

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const linkedTasks = noteId ? tasks.filter((t) => t.noteId === noteId) : [];
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
            onPress={() => setShowPrintModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="print-outline" size={ri(20)} color={theme.text} />
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

        {/* Subject selector */}
        <TouchableOpacity
          style={[
            styles.subjectSelector,
            {
              backgroundColor: selectedSubject
                ? selectedSubject.color + '15'
                : theme.surface,
              borderColor: selectedSubject
                ? selectedSubject.color
                : theme.border,
            },
          ]}
          onPress={() => setShowSubjectPicker(!showSubjectPicker)}
        >
          {selectedSubject ? (
            <>
              <Ionicons
                name={selectedSubject.icon as any}
                size={ri(16)}
                color={selectedSubject.color}
              />
              <Text
                style={[styles.subjectText, { color: selectedSubject.color }]}
                numberOfLines={1}
              >
                {selectedSubject.name}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="folder-outline" size={ri(16)} color={theme.textTertiary} />
              <Text style={[styles.subjectText, { color: theme.textTertiary }]}>
                No subject
              </Text>
            </>
          )}
          <Ionicons name="chevron-down" size={ri(14)} color={theme.textTertiary} />
        </TouchableOpacity>

        {showSubjectPicker && (
          <View
            style={[
              styles.subjectDropdown,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={styles.subjectDropdownItem}
              onPress={() => {
                setSubjectId(null);
                setShowSubjectPicker(false);
                hasChanges.current = true;
              }}
            >
              <Text style={[styles.subjectDropdownText, { color: theme.textSecondary }]}>
                None
              </Text>
            </TouchableOpacity>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.subjectDropdownItem}
                onPress={() => {
                  setSubjectId(s.id);
                  setShowSubjectPicker(false);
                  hasChanges.current = true;
                }}
              >
                <View style={[styles.subjectDropdownDot, { backgroundColor: s.color }]} />
                <Ionicons name={s.icon as any} size={ri(14)} color={s.color} />
                <Text
                  style={[styles.subjectDropdownText, { color: theme.text, marginLeft: rs(6) }]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          {/* AI Summarize */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary + '12' }]}
            onPress={handleSummarize}
          >
            <Text style={styles.actionBtnIcon}>✨</Text>
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>
              Summarize
            </Text>
          </TouchableOpacity>

          {/* OCR */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.warning + '20' }]}
            onPress={handleOcr}
          >
            <Ionicons name="scan" size={ri(16)} color={COLORS.warning} />
            <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>
              OCR
            </Text>
          </TouchableOpacity>

          {/* Generate Flashcards */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.accent + '15' }]}
            onPress={() => setShowFlashcardGen(true)}
          >
            <Ionicons name="albums" size={ri(16)} color={COLORS.accent} />
            <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>
              Flashcards
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saved AI Summary */}
        {aiSummary && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: COLORS.primary + '08', borderColor: COLORS.primary + '30' },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: COLORS.primary }]}>
                ✨ AI Summary
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setAiSummary(null);
                  hasChanges.current = true;
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={ri(18)} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.summaryText, { color: theme.text }]}>
              {aiSummary}
            </Text>
          </View>
        )}

        {/* Saved OCR Text */}
        {ocrText && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: COLORS.warning + '08', borderColor: COLORS.warning + '30' },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: COLORS.warning }]}>
                🔍 Extracted Text (OCR)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setOcrText(null);
                  hasChanges.current = true;
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={ri(18)} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.summaryText, { color: theme.text }]}>
              {ocrText}
            </Text>
          </View>
        )}

        {/* Linked Tasks Section */}
        {!isNew && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                LINKED TASKS
              </Text>
              <TouchableOpacity
                onPress={() => setShowTaskForm(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle-outline" size={ri(20)} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {linkedTasks.length === 0 ? (
              <Text style={[styles.noTasks, { color: theme.textTertiary }]}>
                No tasks linked to this note
              </Text>
            ) : (
              linkedTasks.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.miniTask,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.miniTaskDot,
                      {
                        backgroundColor: task.completed
                          ? COLORS.success
                          : PRIORITY_CONFIG[task.priority].color,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.miniTaskText,
                      {
                        color: theme.text,
                        textDecorationLine: task.completed ? 'line-through' : 'none',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.completed && (
                    <Ionicons name="checkmark-circle" size={ri(14)} color={COLORS.success} />
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* AI Summary Modal */}
      <Modal visible={showAiModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom + rs(SPACING.lg),
              },
            ]}
          >
            <View style={[styles.modalHeader, { paddingHorizontal: horizontalPadding }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                ✨ AI Summary
              </Text>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close" size={ri(24)} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
            >
              {aiLoading ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text
                    style={[styles.aiLoadingText, { color: theme.textSecondary }]}
                  >
                    Generating summary...
                  </Text>
                </View>
              ) : tempSummary ? (
                <Text style={[styles.modalSummaryText, { color: theme.text }]}>
                  {tempSummary}
                </Text>
              ) : null}
            </ScrollView>

            {!aiLoading && tempSummary && (
              <View style={[styles.modalActions, { paddingHorizontal: horizontalPadding }]}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: COLORS.primary }]}
                  onPress={handleSaveSummary}
                >
                  <Ionicons name="save-outline" size={ri(16)} color="#FFF" />
                  <Text style={styles.modalActionText}>Save Summary</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalActionBtn,
                    { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={handleSummarize}
                >
                  <Ionicons name="refresh" size={ri(16)} color={theme.text} />
                  <Text style={[styles.modalActionText, { color: theme.text }]}>
                    Regenerate
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* OCR Modal */}
      <Modal visible={showOcrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom + rs(SPACING.lg),
              },
            ]}
          >
            <View style={[styles.modalHeader, { paddingHorizontal: horizontalPadding }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                🔍 OCR Result
              </Text>
              <TouchableOpacity onPress={() => setShowOcrModal(false)}>
                <Ionicons name="close" size={ri(24)} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
            >
              {ocrLoading ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.warning} />
                  <Text style={[styles.aiLoadingText, { color: theme.textSecondary }]}>
                    Extracting text...
                  </Text>
                </View>
              ) : ocrResult ? (
                <TextInput
                  style={[
                    styles.ocrTextArea,
                    { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                  ]}
                  value={ocrResult}
                  onChangeText={setOcrResult}
                  multiline
                  textAlignVertical="top"
                />
              ) : null}
            </ScrollView>

            {!ocrLoading && ocrResult && (
              <View style={[styles.modalActions, { paddingHorizontal: horizontalPadding }]}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: COLORS.warning }]}
                  onPress={handleSaveOcrText}
                >
                  <Ionicons name="save-outline" size={ri(16)} color="#FFF" />
                  <Text style={styles.modalActionText}>Save as Note Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalActionBtn,
                    { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={handleOcr}
                >
                  <Ionicons name="refresh" size={ri(16)} color={theme.text} />
                  <Text style={[styles.modalActionText, { color: theme.text }]}>
                    Re-scan
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Flashcard Generator Modal */}
      <FlashcardGenerator
        visible={showFlashcardGen}
        noteTitle={title}
        noteContent={textContent}
        onClose={() => setShowFlashcardGen(false)}
        onSave={handleSaveFlashcards}
      />

      {/* Print Options Modal */}
      <PrintPreviewModal
        visible={showPrintModal}
        title="Print Note"
        options={[
          { key: 'includeDrawing', label: 'Include Drawing', value: printOptions.includeDrawing },
          { key: 'includeSummary', label: 'Include AI Summary', value: printOptions.includeSummary },
          { key: 'includeOcrText', label: 'Include OCR Text', value: printOptions.includeOcrText },
        ]}
        onToggleOption={(key) =>
          setPrintOptions((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
        }
        onPrint={handlePrint}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Task Form Modal */}
      <TaskForm
        visible={showTaskForm}
        subjects={subjects}
        notes={useNotesStore.getState().notes}
        defaultNoteId={noteId}
        defaultSubjectId={subjectId}
        onClose={() => setShowTaskForm(false)}
        onSave={handleSaveTask}
      />
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
    gap: rs(SPACING.xs),
  },
  headerButton: {
    padding: rs(SPACING.xs),
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
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    paddingHorizontal: rs(SPACING.md),
    paddingVertical: rs(SPACING.sm),
    marginBottom: rs(SPACING.md),
    gap: rs(SPACING.xs),
  },
  subjectText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '500',
    flex: 1,
  },
  subjectDropdown: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    marginBottom: rs(SPACING.md),
    overflow: 'hidden',
  },
  subjectDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(SPACING.sm + 2),
    paddingHorizontal: rs(SPACING.md),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: rs(4),
  },
  subjectDropdownDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    marginRight: rs(2),
  },
  subjectDropdownText: {
    fontSize: rf(FONT_SIZES.body),
    flex: 1,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    marginBottom: rs(SPACING.lg),
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: rs(90),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rr(RADIUS.md),
    paddingVertical: rs(SPACING.sm + 2),
    gap: rs(SPACING.xs),
  },
  actionBtnIcon: {
    fontSize: rf(14),
  },
  actionBtnText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '600',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md),
    marginBottom: rs(SPACING.lg),
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(SPACING.sm),
  },
  summaryTitle: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  summaryText: {
    fontSize: rf(FONT_SIZES.body),
    lineHeight: rf(FONT_SIZES.body) * 1.5,
  },
  tasksSection: {
    marginBottom: rs(SPACING.xl),
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(SPACING.sm),
  },
  noTasks: {
    fontSize: rf(FONT_SIZES.small),
    fontStyle: 'italic',
  },
  miniTask: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rr(RADIUS.sm),
    padding: rs(SPACING.sm + 2),
    marginBottom: rs(SPACING.xs),
    gap: rs(SPACING.sm),
  },
  miniTaskDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
  },
  miniTaskText: {
    fontSize: rf(FONT_SIZES.body),
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    borderTopLeftRadius: rr(RADIUS.xxl),
    borderTopRightRadius: rr(RADIUS.xxl),
    paddingTop: rs(SPACING.lg),
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(SPACING.md),
  },
  modalTitle: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    marginBottom: rs(SPACING.md),
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: rs(SPACING.huge),
  },
  aiLoadingText: {
    marginTop: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.body),
  },
  modalSummaryText: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    lineHeight: rf(FONT_SIZES.bodyLarge) * 1.6,
  },
  ocrTextArea: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.md),
    fontSize: rf(FONT_SIZES.body),
    minHeight: rs(150),
    lineHeight: rf(FONT_SIZES.body) * 1.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rr(RADIUS.md),
    paddingVertical: rs(SPACING.md),
    gap: rs(SPACING.xs),
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: rf(FONT_SIZES.body),
  },
});
