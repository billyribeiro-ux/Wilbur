// ============================================================================
// WHITEBOARD STORE - Zustand SSOT
// ============================================================================
// Single source of truth for all whiteboard state
// ============================================================================

import { create } from 'zustand';
import type {
  WhiteboardTool,
  WhiteboardShape,
  EmojiObject,
  WhiteboardHistoryEntry,
  ViewportTransform,
  RemoteCursor,
  WhiteboardConfig,
} from '../types';
import { DEFAULT_WHITEBOARD_CONFIG } from '../types';

interface WhiteboardStore {
  // Tool State
  tool: WhiteboardTool;
  color: string;
  size: number;
  opacity: number;
  
  // Canvas State
  shapes: Map<string, WhiteboardShape>;
  emojis: Map<string, EmojiObject>;
  selectedShapeIds: Set<string>;
  
  // History State
  history: WhiteboardHistoryEntry[];
  historyIndex: number;
  
  // Viewport State
  viewport: ViewportTransform;
  
  // Collaboration State
  remoteCursors: Map<string, RemoteCursor>;
  
  // Config
  config: WhiteboardConfig;
  
  // Recording/Presenter State
  mode: 'whiteboard';
  recordInkInOutput: boolean;
  background: string | null;
  
  // Eraser State
  eraserMode: 'stroke' | 'area';
  
  // Text Formatting State
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  
  // Emoji Feature Flags
  emojiDebug: boolean;
  emojiSnapToGrid: boolean;
  emojiUseTwemoji: boolean;
  
  // Tool Actions
  setTool: (tool: WhiteboardTool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  
  // Shape Actions
  addShape: (shape: WhiteboardShape) => void;
  updateShape: (id: string, updates: Partial<WhiteboardShape>) => void;
  deleteShape: (id: string) => void;
  clearShapes: () => void;
  
  // Selection Actions
  selectShape: (id: string) => void;
  deselectShape: (id: string) => void;
  clearSelection: () => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  saveHistory: (action: string) => void;
  
  // Viewport Actions
  setPan: (panX: number, panY: number) => void;
  setZoom: (zoom: number) => void;
  resetViewport: () => void;
  
  // Collaboration Actions
  updateRemoteCursor: (userId: string, cursor: RemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  
  // Recording/Presenter Actions
  setMode: (mode: 'whiteboard') => void;
  setRecordInkInOutput: (enabled: boolean) => void;
  setBackground: (background: string | null) => void;
  
  // Eraser Actions
  setEraserMode: (mode: 'stroke' | 'area') => void;
  
  // Text Formatting Actions
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontWeight: (fontWeight: number) => void;
  setFontStyle: (fontStyle: 'normal' | 'italic') => void;
  setTextDecoration: (textDecoration: 'none' | 'underline') => void;
  setTextAlign: (textAlign: 'left' | 'center' | 'right') => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  
  // Emoji Actions
  addEmoji: (emoji: EmojiObject) => void;
  updateEmoji: (id: string, updates: Partial<EmojiObject>) => void;
  deleteEmoji: (id: string) => void;
  clearEmojis: () => void;
  
  // History with custom data
  pushHistory: (action: string, data?: unknown) => void;
  
  // Utility Actions
  reset: () => void;
}

const DEFAULT_VIEWPORT: ViewportTransform = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  // Initial State
  tool: 'pen',
  color: '#000000',
  size: 3,
  opacity: 1,
  shapes: new Map(),
  emojis: new Map(),
  selectedShapeIds: new Set(),
  history: [{ shapes: new Map(), timestamp: Date.now(), action: 'init' }],
  historyIndex: 0,
  viewport: DEFAULT_VIEWPORT,
  remoteCursors: new Map(),
  config: DEFAULT_WHITEBOARD_CONFIG as WhiteboardConfig,
  
  // Recording/Presenter State
  mode: 'whiteboard',
  recordInkInOutput: false,
  background: null,
  
  // Eraser State
  eraserMode: 'stroke',
  
  // Text Formatting State
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  
  // Emoji Feature Flags
  emojiDebug: false,
  emojiSnapToGrid: false,
  emojiUseTwemoji: false,
  
  // Tool Actions
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setOpacity: (opacity) => set({ opacity }),
  
  // Shape Actions
  addShape: (shape) => {
    const { shapes } = get();
    const newShapes = new Map(shapes);
    newShapes.set(shape.id, shape);
    set({ shapes: newShapes });
    get().saveHistory('add');
  },
  
  updateShape: (id, updates) => {
    const { shapes } = get();
    const shape = shapes.get(id);
    if (!shape) return;
    
    const newShapes = new Map(shapes);
    newShapes.set(id, { ...shape, ...updates });
    set({ shapes: newShapes });
  },
  
  deleteShape: (id) => {
    const { shapes } = get();
    const newShapes = new Map(shapes);
    newShapes.delete(id);
    set({ shapes: newShapes });
    get().saveHistory('delete');
  },
  
  clearShapes: () => {
    set({ shapes: new Map(), selectedShapeIds: new Set() });
    get().saveHistory('clear');
  },
  
  // Selection Actions
  selectShape: (id) => {
    const { selectedShapeIds } = get();
    const newSelection = new Set(selectedShapeIds);
    newSelection.add(id);
    set({ selectedShapeIds: newSelection });
  },
  
  deselectShape: (id) => {
    const { selectedShapeIds } = get();
    const newSelection = new Set(selectedShapeIds);
    newSelection.delete(id);
    set({ selectedShapeIds: newSelection });
  },
  
  clearSelection: () => {
    set({ selectedShapeIds: new Set() });
  },
  
  // History Actions
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    if (entry) {
      set({
        shapes: new Map(entry.shapes),
        historyIndex: newIndex,
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    if (entry) {
      set({
        shapes: new Map(entry.shapes),
        historyIndex: newIndex,
      });
    }
  },
  
  saveHistory: (action) => {
    const { shapes, history, historyIndex, config } = get();
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new entry
    newHistory.push({
      shapes: new Map(shapes),
      timestamp: Date.now(),
      action,
    });
    
    // Limit history size
    if (newHistory.length > config.maxHistorySize) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  // Viewport Actions
  setPan: (panX, panY) => {
    set({
      viewport: { ...get().viewport, panX, panY },
    });
  },
  
  setZoom: (zoom) => {
    const { config } = get();
    const clampedZoom = Math.max(
      config.minZoom,
      Math.min(config.maxZoom, zoom)
    );
    set({
      viewport: { ...get().viewport, zoom: clampedZoom },
    });
  },
  
  resetViewport: () => {
    set({ viewport: DEFAULT_VIEWPORT });
  },
  
  // Collaboration Actions
  updateRemoteCursor: (userId, cursor) => {
    const { remoteCursors } = get();
    const newCursors = new Map(remoteCursors);
    newCursors.set(userId, cursor);
    set({ remoteCursors: newCursors });
  },
  
  removeRemoteCursor: (userId) => {
    const { remoteCursors } = get();
    const newCursors = new Map(remoteCursors);
    newCursors.delete(userId);
    set({ remoteCursors: newCursors });
  },
  
  // Recording/Presenter Actions
  setMode: (mode) => set({ mode }),
  setRecordInkInOutput: (enabled) => set({ recordInkInOutput: enabled }),
  setBackground: (background) => set({ background }),
  
  // Eraser Actions
  setEraserMode: (eraserMode: 'stroke' | 'area') => set({ eraserMode }),
  
  // Text Formatting Actions
  setFontFamily: (fontFamily: string) => set({ fontFamily }),
  setFontSize: (fontSize: number) => set({ fontSize }),
  setFontWeight: (fontWeight: number) => set({ fontWeight }),
  setFontStyle: (fontStyle: 'normal' | 'italic') => set({ fontStyle }),
  setTextDecoration: (textDecoration: 'none' | 'underline') => set({ textDecoration }),
  setTextAlign: (textAlign: 'left' | 'center' | 'right') => set({ textAlign }),
  toggleBold: () => set((state) => ({ fontWeight: state.fontWeight === 700 ? 400 : 700 })),
  toggleItalic: () => set((state) => ({ fontStyle: state.fontStyle === 'italic' ? 'normal' : 'italic' })),
  toggleUnderline: () => set((state) => ({ textDecoration: state.textDecoration === 'underline' ? 'none' : 'underline' })),
  
  // Emoji Actions
  addEmoji: (emoji: EmojiObject) => {
    const { emojis } = get();
    const newEmojis = new Map(emojis);
    newEmojis.set(emoji.id, emoji);
    set({ emojis: newEmojis });
  },
  
  updateEmoji: (id: string, updates: Partial<EmojiObject>) => {
    const { emojis } = get();
    const emoji = emojis.get(id);
    if (!emoji) return;
    
    const newEmojis = new Map(emojis);
    newEmojis.set(id, { ...emoji, ...updates });
    set({ emojis: newEmojis });
  },
  
  deleteEmoji: (id: string) => {
    const { emojis } = get();
    const newEmojis = new Map(emojis);
    newEmojis.delete(id);
    set({ emojis: newEmojis });
  },
  
  clearEmojis: () => {
    set({ emojis: new Map() });
  },
  
  // History with custom data
  pushHistory: (action: string, data?: unknown) => {
    const { shapes, history, historyIndex, config } = get();
    
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new entry with custom data
    newHistory.push({
      shapes: new Map(shapes),
      timestamp: Date.now(),
      action,
      data,
    });
    
    // Limit history size
    if (newHistory.length > config.maxHistorySize) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  // Utility Actions
  reset: () => {
    set({
      tool: 'pen',
      color: '#000000',
      size: 3,
      opacity: 1,
      shapes: new Map(),
      emojis: new Map(),
      selectedShapeIds: new Set(),
      history: [{ shapes: new Map(), timestamp: Date.now(), action: 'reset' }],
      historyIndex: 0,
      viewport: DEFAULT_VIEWPORT,
      remoteCursors: new Map(),
    });
  },
}));

// Expose store in dev/test for E2E diagnostics (no-op in SSR)
declare global {
  interface Window {
    __WB_STORE__?: typeof useWhiteboardStore;
  }
}

if (typeof window !== 'undefined') {
  (window as Window).__WB_STORE__ = useWhiteboardStore;
}
