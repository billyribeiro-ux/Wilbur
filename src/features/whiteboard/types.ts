// ============================================================================
// WHITEBOARD TYPES - Complete Type Definitions (SSOT-aligned)
// ============================================================================

export interface WhiteboardPoint {
  x: number;
  y: number;
  p?: number; // pressure
}

// Viewport WITH CSS dimensions – used at the "edges" for screen/world math
export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

// Transform-only viewport – used by tools/renderers that don't care about size
export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number;
}

export type WhiteboardTool =
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'stamp';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export type CompositeMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten';

export interface LinearGradient {
  type: 'linear';
  angleDeg: number;
  stops: Array<{
    offset: number;
    color: string;
    alpha: number;
  }>;
}

// ============================================================================
// Base Annotation Types
// ============================================================================

export interface BaseAnnotation {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  zIndex?: number;
}

// Emoji annotation
export interface EmojiAnnotation extends BaseAnnotation {
  type: 'stamp';
  glyph: string;
}

// Simplified alias for compatibility
export type EmojiObject = EmojiAnnotation;

// Text annotation (Zoom-like rich text)
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  width: number;
  height: number;
}

// Highlighter annotation (world-space stroke)
export interface HighlighterAnnotation extends BaseAnnotation {
  type: 'highlighter';
  points: WhiteboardPoint[];
  colorGradient: LinearGradient;
  thickness: number;
  composite: CompositeMode;
}

// Pen / generic shape annotations
export interface WhiteboardShape {
  id: string;
  type: WhiteboardTool;
  color: string;
  fillColor?: string;
  size: number;
  lineStyle: LineStyle;
  opacity: number;
  points: WhiteboardPoint[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  stampEmoji?: string;
  width?: number;
  height?: number;
  rotation?: number;
  selected?: boolean;
  locked?: boolean;
  userId?: string;
  timestamp?: number;
  createdAt?: number;
  updatedAt?: number;
  zIndex?: number;
  gradient?: LinearGradient;
  composite?: CompositeMode;
}

export type WhiteboardAnnotation =
  | EmojiAnnotation
  | TextAnnotation
  | HighlighterAnnotation
  | WhiteboardShape;

// ============================================================================
// Remote Cursor Types (Collaboration)
// ============================================================================

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  position: WhiteboardPoint;
  timestamp: number;
}

// ============================================================================
// History / Event Types
// ============================================================================

export interface HistoryEntry {
  action: string;
  timestamp: number;
  data: unknown;
  snapshot?: Map<string, WhiteboardAnnotation>;
}

// Event Types for collaboration
export interface WhiteboardEvent {
  type: string;
  roomId: string;
  userId: string;
  timestamp: number;
  payload: unknown;
}

export interface WhiteboardHistoryEntry {
  shapes: Map<string, WhiteboardShape>;
  timestamp: number;
  action: string;
  data?: unknown;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'webp' | 'jpeg' | 'jpg';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  dpi?: number;
  // transparent flag removed; we always render against the whiteboard background
  includeBackground?: boolean;
}

// ============================================================================
// Config Types
// ============================================================================

export interface WhiteboardConfig {
  maxHistorySize: number;
  defaultTool: WhiteboardTool;
  defaultColor: string;
  defaultSize: number;
  enableCollaboration: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  minZoom: number;
  maxZoom: number;
  panSpeed: number;
  zoomSpeed: number;
}

export const DEFAULT_WHITEBOARD_CONFIG: WhiteboardConfig = {
  maxHistorySize: 100,
  defaultTool: 'pen',
  defaultColor: '#000000',
  defaultSize: 3,
  enableCollaboration: true,
  enableAutoSave: false,
  autoSaveInterval: 30000,
  minZoom: 0.1,
  maxZoom: 10,
  panSpeed: 1,
  zoomSpeed: 0.001,
};

// ============================================================================
// Toolbar Types
// ============================================================================

export type ToolbarPosition = 'top' | 'right' | 'bottom' | 'left';

export interface ToolbarState {
  position: ToolbarPosition;
  isDragging: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Defaults / Constants
// ============================================================================

// Default gradient for highlighter
export const DEFAULT_HIGHLIGHTER_GRADIENT: LinearGradient = {
  type: 'linear',
  angleDeg: 90,
  stops: [
    { offset: 0, color: '#FFFF00', alpha: 0.3 },
    { offset: 0.5, color: '#FFFF00', alpha: 0.5 },
    { offset: 1, color: '#FFFF00', alpha: 0.3 },
  ],
};

// Emoji font stack for cross-platform color emoji support
export const EMOJI_FONT_STACK =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","EmojiOne Mozilla","Segoe UI Symbol",sans-serif';

// Text font families
export const TEXT_FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
];

// Text font sizes
export const TEXT_FONT_SIZES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96,
];

// Text font weights
export const TEXT_FONT_WEIGHTS = [
  { name: 'Light', value: 300 },
  { name: 'Normal', value: 400 },
  { name: 'Medium', value: 500 },
  { name: 'Semi Bold', value: 600 },
  { name: 'Bold', value: 700 },
  { name: 'Extra Bold', value: 800 },
];

// ============================================================================
// Simplified Aliases
// ============================================================================

export type TextObject = TextAnnotation;

export type FreehandStroke = WhiteboardShape & {
  type: 'pen';
  points: WhiteboardPoint[];
};

export type HighlighterStroke = HighlighterAnnotation;

export type BoardElement =
  | EmojiObject
  | TextObject
  | FreehandStroke
  | HighlighterStroke
  | WhiteboardShape;

export type Tool = WhiteboardTool;

// ============================================================================
// Store State Types
// ============================================================================

export interface WhiteboardState {
  shapes: Map<string, WhiteboardShape>;
  selectedShapeIds: Set<string>;
  history: WhiteboardHistoryEntry[];
  historyIndex: number;
  // Store keeps transform; dimensions are supplied per-canvas (SSOT: rect.width/height)
  viewport: ViewportTransform;
  remoteCursors: Map<string, RemoteCursor>;
}
