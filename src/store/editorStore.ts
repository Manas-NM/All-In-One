import { create } from 'zustand';
import { Notebook, NotebookPage, Stroke, CanvasObject, CanvasTemplate } from '../types';
import * as db from '../services/database';
import {
  loadPageDrawing,
  savePageDrawing,
  duplicatePageDrawing,
  deletePageDrawing,
} from '../services/storage';

interface EditorState {
  notebook: Notebook | null;
  pages: NotebookPage[];
  activePageId: string | null;
  activeStrokes: Stroke[];
  canvasObjects: CanvasObject[];
  isLoading: boolean;

  openNotebook: (notebookId: string, pageId?: string) => Promise<void>;
  setActivePage: (pageId: string) => Promise<void>;
  saveActivePage: (strokes: Stroke[], searchText?: string) => Promise<void>;

  addPage: (template?: CanvasTemplate) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  duplicatePage: (pageId: string) => Promise<void>;
  reorderPages: (orderedPageIds: string[]) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  notebook: null,
  pages: [],
  activePageId: null,
  activeStrokes: [],
  canvasObjects: [],
  isLoading: false,

  openNotebook: async (notebookId, pageId) => {
    set({ isLoading: true });
    try {
      const [notebook, pages] = await Promise.all([
        db.getNotebookById(notebookId),
        db.getPagesByNotebook(notebookId),
      ]);

      if (!notebook) {
        set({ notebook: null, pages: [], activePageId: null, activeStrokes: [], isLoading: false });
        return;
      }

      const targetPage = pageId
        ? pages.find((p) => p.id === pageId) ?? pages[0]
        : pages[0];

      const pageStrokes = targetPage
        ? await loadPageDrawing(notebook.id, targetPage.id)
        : [];
      const pageObjects = targetPage
        ? await db.getCanvasObjects(targetPage.id)
        : [];

      set({
        notebook,
        pages,
        activePageId: targetPage?.id ?? null,
        activeStrokes: pageStrokes,
        canvasObjects: pageObjects,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to open notebook', error);
      set({ isLoading: false });
    }
  },

  setActivePage: async (pageId) => {
    const { notebook } = get();
    if (!notebook) return;

    const [strokes, objects] = await Promise.all([
      loadPageDrawing(notebook.id, pageId),
      db.getCanvasObjects(pageId),
    ]);

    set({ activePageId: pageId, activeStrokes: strokes, canvasObjects: objects });
  },

  saveActivePage: async (strokes, searchText = '') => {
    const { notebook, activePageId } = get();
    if (!notebook || !activePageId) return;

    await savePageDrawing(notebook.id, activePageId, strokes);
    await db.replacePageSearchIndex(notebook.id, activePageId, searchText);
    set({ activeStrokes: strokes });
  },

  addPage: async (template) => {
    const { notebook } = get();
    if (!notebook) return;

    const page = await db.createPage(notebook.id, {
      title: `Page ${get().pages.length + 1}`,
      template: template ?? notebook.template,
    });

    set((state) => ({ pages: [...state.pages, page] }));
    await get().setActivePage(page.id);
  },

  deletePage: async (pageId) => {
    const { notebook, activePageId } = get();
    if (!notebook) return;

    await db.deletePage(pageId);
    await deletePageDrawing(notebook.id, pageId);
    const pages = await db.getPagesByNotebook(notebook.id);
    const next = pages.find((p) => p.id !== pageId) ?? null;

    if (activePageId === pageId && next) {
      const strokes = await loadPageDrawing(notebook.id, next.id);
      set({ pages, activePageId: next.id, activeStrokes: strokes });
      return;
    }

    set({ pages });
  },

  duplicatePage: async (pageId) => {
    const { notebook, pages } = get();
    if (!notebook) return;

    const source = pages.find((p) => p.id === pageId);
    if (!source) return;

    const duplicated = await db.createPage(notebook.id, {
      title: `${source.title} Copy`,
      template: source.template,
      insertAt: source.pageNumber + 1,
    });

    await duplicatePageDrawing(notebook.id, source.id, duplicated.id);
    const freshPages = await db.getPagesByNotebook(notebook.id);
    set({ pages: freshPages });
  },

  reorderPages: async (orderedPageIds) => {
    const { notebook } = get();
    if (!notebook) return;
    await db.reorderPages(notebook.id, orderedPageIds);
    const pages = await db.getPagesByNotebook(notebook.id);
    set({ pages });
  },
}));
