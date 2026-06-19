import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DrawingCanvas from '../components/DrawingCanvas';
import { useEditorStore } from '../store/editorStore';
import { useToolStore } from '../store/toolStore';
import { useTasksStore } from '../store/tasksStore';
import { useFlashcardsStore } from '../store/flashcardsStore';
import { exportNotebookToPdf } from '../services/storage';
import { summarizeNote } from '../services/aiService';
import { recognizeTextFromCanvas, strokesToSvg } from '../services/ocrService';
import { upsertCanvasObject, resolveLegacyNoteToPage } from '../services/database';
import { NotesStackParamList, Stroke, CanvasTemplate } from '../types';
import { COLORS, FONT_SIZES, SPACING, RADIUS, PEN_COLORS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding, getCanvasDimensions } from '../utils/responsive';

type RouteT = RouteProp<NotesStackParamList, 'NoteEditor'>;
type NavT = NativeStackNavigationProp<NotesStackParamList, 'NoteEditor'>;

const templates: CanvasTemplate[] = ['lined', 'grid', 'dotted', 'blank', 'cornell'];

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavT>();
  const route = useRoute<RouteT>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const {
    notebook,
    pages,
    activePageId,
    activeStrokes,
    isLoading,
    openNotebook,
    setActivePage,
    saveActivePage,
    addPage,
    deletePage,
    duplicatePage,
  } = useEditorStore();

  const {
    activeTool,
    penColor,
    penSize,
    highlighterColor,
    highlighterSize,
    zenMode,
    setActiveTool,
    setPenColor,
    setPenSize,
    setHighlighterSize,
    toggleZenMode,
  } = useToolStore();

  const { addTask } = useTasksStore();
  const { createDeck, addBulkCards } = useFlashcardsStore();

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [pageText, setPageText] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [zoomScale, setZoomScale] = useState(1);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) ?? null,
    [pages, activePageId]
  );

  const loadNotebook = useCallback(async () => {
    let notebookId = route.params?.notebookId;
    let pageId = route.params?.pageId;

    if (!notebookId && route.params?.noteId) {
      const mapping = await resolveLegacyNoteToPage(route.params.noteId);
      notebookId = mapping?.notebookId;
      pageId = mapping?.pageId;
    }

    if (!notebookId) return;
    await openNotebook(notebookId, pageId);
  }, [route.params, openNotebook]);

  useEffect(() => {
    loadNotebook();
  }, [loadNotebook]);

  useEffect(() => {
    setStrokes(activeStrokes);
  }, [activeStrokes, activePageId]);

  const handleSavePage = async () => {
    if (!notebook || !activePage) return;

    await saveActivePage(strokes, pageText);

    await upsertCanvasObject({
      id: `text_${activePage.id}`,
      pageId: activePage.id,
      type: 'text',
      payload: JSON.stringify({ text: pageText }),
      zIndex: 1,
    });

    Alert.alert('Saved', 'Page changes saved successfully.');
  };

  const handleAddTaskForPage = async () => {
    if (!notebook || !activePage) return;

    await addTask({
      title: `${notebook.title} • ${activePage.title}`,
      description: 'Linked from notebook page',
      dueDate: null,
      priority: 'medium',
      completed: false,
      noteId: null,
      notebookId: notebook.id,
      pageId: activePage.id,
      subjectId: notebook.folderId ?? null,
    });
    Alert.alert('Task Added', 'A task linked to this page has been created.');
  };

  const handleGenerateFlashcards = async () => {
    if (!notebook || !activePage) return;
    if (!pageText.trim()) {
      Alert.alert('No text', 'Please add some typed notes first.');
      return;
    }

    const deck = await createDeck({
      name: `${notebook.title} - ${activePage.title}`,
      description: 'Auto-generated from notebook page text',
      subjectId: notebook.folderId ?? null,
      noteId: null,
      notebookId: notebook.id,
      pageId: activePage.id,
    });

    const lines = pageText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);

    const cards = lines.map((line, index) => ({
      front: `Key point ${index + 1}?`,
      back: line,
    }));

    await addBulkCards(deck.id, cards);
    Alert.alert('Flashcards Ready', `Created ${cards.length} cards in deck "${deck.name}".`);
  };

  const handleOCR = async () => {
    if (strokes.length === 0) {
      Alert.alert('No writing detected', 'Write something before running OCR.');
      return;
    }

    try {
      const { width, height } = getCanvasDimensions();
      const svg = strokesToSvg(strokes, width, height);
      const btoaFn = (globalThis as any).btoa as ((value: string) => string) | undefined;
      if (!btoaFn) throw new Error('Base64 encoder unavailable');
      const base64 = btoaFn(unescape(encodeURIComponent(svg)));

      const result = await recognizeTextFromCanvas(base64);
      if (result.error) {
        Alert.alert('OCR Error', result.error);
        return;
      }
      setPageText((prev) => (prev ? `${prev}\n${result.text}` : result.text));
      Alert.alert('OCR Complete', 'Recognized text appended to page notes.');
    } catch (error: any) {
      Alert.alert('OCR Error', error?.message || 'Failed to run OCR.');
    }
  };

  const handleSummarize = async () => {
    const result = await summarizeNote(notebook?.title || 'Notebook', pageText);
    if (result.error) {
      Alert.alert('AI Error', result.error);
      return;
    }
    setAiSummary(result.summary ?? '');
    setShowAiSummary(true);
  };

  const handleExport = async () => {
    if (!notebook) return;
    const pagePayload = await Promise.all(
      pages.map(async (page) => ({
        title: page.title,
        template: page.template,
        strokes: page.id === activePageId ? strokes : [],
        text: page.id === activePageId ? pageText : '',
      }))
    );

    const { width, height } = getCanvasDimensions();
    await exportNotebookToPdf(notebook.title, pagePayload, width, height);
  };

  const handleImportPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    await addPage('blank');
    Alert.alert('PDF Imported', 'PDF was added as a new annotation-ready page placeholder.');
  };

  const handleInsertImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled || !activePage) return;

    await upsertCanvasObject({
      id: `image_${Date.now()}`,
      pageId: activePage.id,
      type: 'image',
      payload: JSON.stringify({ uri: result.assets[0].uri }),
      zIndex: 20,
    });

    Alert.alert('Image inserted', 'Image object added to this page.');
  };

  if (isLoading || !notebook) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}> 
        <Text style={{ color: theme.text }}>Loading notebook…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + rs(8),
            borderBottomColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={ri(24)} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {notebook.title}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {activePage?.title || 'Page'} • {activePage?.template.toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleZenMode}>
            <Ionicons name={zenMode ? 'eye-off-outline' : 'eye-outline'} size={ri(20)} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleExport}>
            <Ionicons name="print-outline" size={ri(20)} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSavePage}>
            <Ionicons name="save-outline" size={ri(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.sidebar, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <ScrollView contentContainerStyle={{ paddingBottom: rs(10) }}>
            {pages.map((page) => (
              <TouchableOpacity
                key={page.id}
                style={[
                  styles.pageThumb,
                  {
                    borderColor: activePageId === page.id ? COLORS.primary : theme.border,
                    backgroundColor: activePageId === page.id ? `${COLORS.primary}14` : theme.surface,
                  },
                ]}
                onPress={() => setActivePage(page.id)}
                onLongPress={() =>
                  Alert.alert(page.title, 'Manage page', [
                    { text: 'Duplicate', onPress: () => duplicatePage(page.id) },
                    { text: 'Delete', style: 'destructive', onPress: () => deletePage(page.id) },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Text style={[styles.pageNo, { color: theme.text }]}>{page.pageNumber}</Text>
                <Text style={[styles.pageLabel, { color: theme.textSecondary }]} numberOfLines={1}>{page.title}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.addPageBtn, { borderColor: theme.border }]} onPress={() => addPage()}>
              <Ionicons name="add" size={ri(18)} color={COLORS.primary} />
              <Text style={[styles.addPageText, { color: COLORS.primary }]}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.editorPanel}>
          {!zenMode && (
            <View style={[styles.floatingToolbar, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <TouchableOpacity style={styles.toolBtn} onPress={() => setActiveTool('pen')}>
                <Ionicons name="pencil" size={ri(18)} color={activeTool === 'pen' ? COLORS.primary : theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setActiveTool('highlighter')}>
                <Ionicons name="color-fill" size={ri(18)} color={activeTool === 'highlighter' ? COLORS.primary : theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setActiveTool('eraser')}>
                <Ionicons name="close-circle" size={ri(18)} color={activeTool === 'eraser' ? COLORS.primary : theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setShowTextModal(true)}>
                <Ionicons name="text" size={ri(18)} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleInsertImage}>
                <Ionicons name="image-outline" size={ri(18)} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleImportPdf}>
                <Ionicons name="document-attach-outline" size={ri(18)} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setZoomScale((z) => Math.max(1, Math.min(3, z + 0.25)))}>
                <Ionicons name="add-circle-outline" size={ri(18)} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setZoomScale((z) => Math.max(1, z - 0.25))}>
                <Ionicons name="remove-circle-outline" size={ri(18)} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: rs(6), paddingBottom: rs(6) }}>
            <DrawingCanvas
              initialStrokes={strokes}
              onStrokesChange={setStrokes}
              canvasHeight={getCanvasDimensions().height}
              canvasWidth={getCanvasDimensions().width}
              template={activePage?.template || 'lined'}
              activeTool={activeTool}
              penColor={penColor}
              penSize={penSize}
              highlighterColor={highlighterColor}
              highlighterSize={highlighterSize}
              zoomScale={zoomScale}
            />
          </ScrollView>

          {!zenMode && (
            <View style={[styles.actionsRow, { borderTopColor: theme.border }]}> 
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(8) }}>
                {PEN_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: color,
                        borderColor: penColor === color ? COLORS.primary : '#fff',
                      },
                    ]}
                    onPress={() => setPenColor(color)}
                  />
                ))}
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={() => setPenSize(Math.max(1, penSize - 1))}>
                  <Text style={{ color: theme.textSecondary }}>Pen -</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={() => setPenSize(Math.min(12, penSize + 1))}>
                  <Text style={{ color: theme.textSecondary }}>Pen +</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={() => setHighlighterSize(Math.max(4, highlighterSize - 1))}>
                  <Text style={{ color: theme.textSecondary }}>HL -</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={() => setHighlighterSize(Math.min(24, highlighterSize + 1))}>
                  <Text style={{ color: theme.textSecondary }}>HL +</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={handleOCR}>
                  <Text style={{ color: theme.textSecondary }}>OCR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={handleSummarize}>
                  <Text style={{ color: theme.textSecondary }}>AI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={handleAddTaskForPage}>
                  <Text style={{ color: theme.textSecondary }}>Link Task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.border }]} onPress={handleGenerateFlashcards}>
                  <Text style={{ color: theme.textSecondary }}>Flashcards</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <Modal visible={showTextModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Page Text Box</Text>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <Ionicons name="close" size={ri(20)} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              multiline
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Type notes here..."
              placeholderTextColor={theme.textTertiary}
              value={pageText}
              onChangeText={setPageText}
            />
            <View style={{ flexDirection: 'row', gap: rs(8), justifyContent: 'flex-end' }}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setShowTextModal(false)}>
                <Text style={{ color: theme.textSecondary }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn]} onPress={() => setShowTextModal(false)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAiSummary} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>AI Summary</Text>
            <ScrollView style={{ maxHeight: rs(220), marginTop: rs(10) }}>
              <Text style={{ color: theme.textSecondary, fontSize: rf(FONT_SIZES.small), lineHeight: rf(20) }}>{aiSummary || 'No summary generated.'}</Text>
            </ScrollView>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: rs(12), alignSelf: 'flex-end' }]} onPress={() => setShowAiSummary(false)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingHorizontal: getScreenHorizontalPadding(),
    paddingBottom: rs(10),
  },
  headerTitle: { fontSize: rf(FONT_SIZES.title), fontWeight: '700' },
  headerSub: { marginTop: rs(2), fontSize: rf(FONT_SIZES.caption), fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: rs(8), alignItems: 'center' },
  headerBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: rs(92),
    borderRightWidth: 1,
    paddingTop: rs(8),
    paddingHorizontal: rs(8),
  },
  pageThumb: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    minHeight: rs(68),
    padding: rs(8),
    marginBottom: rs(8),
  },
  pageNo: { fontSize: rf(FONT_SIZES.small), fontWeight: '700' },
  pageLabel: { marginTop: rs(4), fontSize: rf(FONT_SIZES.caption) },
  addPageBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: rr(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(10),
  },
  addPageText: { marginTop: rs(4), fontSize: rf(FONT_SIZES.caption), fontWeight: '700' },
  editorPanel: { flex: 1, padding: rs(8) },
  floatingToolbar: {
    borderWidth: 1,
    borderRadius: rr(999),
    paddingHorizontal: rs(8),
    paddingVertical: rs(6),
    flexDirection: 'row',
    alignSelf: 'center',
    gap: rs(6),
    marginBottom: rs(8),
  },
  toolBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rr(999),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    borderTopWidth: 1,
    paddingTop: rs(8),
    marginTop: rs(8),
  },
  colorDot: {
    width: rs(22),
    height: rs(22),
    borderRadius: rr(999),
    borderWidth: 2,
  },
  quickBtn: {
    borderWidth: 1,
    borderRadius: rr(999),
    paddingHorizontal: rs(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: rs(16),
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.lg),
    padding: rs(14),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: rf(FONT_SIZES.body), fontWeight: '700' },
  modalInput: {
    minHeight: rs(160),
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    marginTop: rs(10),
    marginBottom: rs(12),
    padding: rs(10),
    textAlignVertical: 'top',
    fontSize: rf(FONT_SIZES.small),
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
  },
  primaryBtn: {
    borderRadius: rr(RADIUS.md),
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
    backgroundColor: COLORS.primary,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.lg),
    padding: rs(14),
  },
});
