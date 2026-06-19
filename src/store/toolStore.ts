import { create } from 'zustand';
import { DrawingTool, PenType, EraserMode } from '../types';

interface ToolState {
  activeTool: DrawingTool;
  penType: PenType;
  penColor: string;
  penSize: number;
  highlighterColor: string;
  highlighterSize: number;
  eraserMode: EraserMode;
  shapeRecognition: boolean;
  zenMode: boolean;

  setActiveTool: (tool: DrawingTool) => void;
  setPenType: (type: PenType) => void;
  setPenColor: (color: string) => void;
  setPenSize: (size: number) => void;
  setHighlighterColor: (color: string) => void;
  setHighlighterSize: (size: number) => void;
  setEraserMode: (mode: EraserMode) => void;
  toggleShapeRecognition: () => void;
  toggleZenMode: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'pen',
  penType: 'ballpoint',
  penColor: '#2D3436',
  penSize: 2,
  highlighterColor: '#FFE066',
  highlighterSize: 12,
  eraserMode: 'stroke',
  shapeRecognition: true,
  zenMode: false,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setPenType: (penType) => set({ penType }),
  setPenColor: (penColor) => set({ penColor }),
  setPenSize: (penSize) => set({ penSize }),
  setHighlighterColor: (highlighterColor) => set({ highlighterColor }),
  setHighlighterSize: (highlighterSize) => set({ highlighterSize }),
  setEraserMode: (eraserMode) => set({ eraserMode }),
  toggleShapeRecognition: () => set((state) => ({ shapeRecognition: !state.shapeRecognition })),
  toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
}));
