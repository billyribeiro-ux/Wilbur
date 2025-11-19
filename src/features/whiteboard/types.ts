// ============================================================================
// TYPE DEFINITIONS - Microsoft L67+ Enterprise Grade
// ============================================================================
// Version: 2.0.0
// Last Updated: 2025-01-18
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

export interface WhiteboardPoint {
  x: number;
  y: number;
  pressure?: number; // Optional pressure for stylus input
  timestamp?: number; // Optional timestamp for velocity calculations
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  dpr?: number; // Device pixel ratio at time of viewport capture
}

export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number;
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface StrokeMetadata {
  dpr: number;                    // Device pixel ratio when stroke was created
  deviceType: 'touch' | 'coarse' | 'fine';  // Input device classification
  pointerType: string;             // 'mouse' | 'pen' | 'touch' | etc.
  renderTime?: number;             // Average frame time during drawing
  simplificationRatio?: number;    // Point reduction percentage
  originalPointCount?: number;     // Points before simplification
  finalPointCount?: number;        // Points after simplification
  drawDuration?: number;           // Total time from start to end
  platform?: string;               // OS/Browser info
  inputLatency?: number;           // Average input latency
}

// ============================================================================
// Shape Base Types
// ============================================================================

export interface WhiteboardShapeBase {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  metadata?: StrokeMetadata;  // Optional metadata for all shapes
}

// ============================================================================
// Gradient Types
// ============================================================================

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

export interface WhiteboardGradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;           // For linear gradients
  centerX?: number;          // For radial gradients
  centerY?: number;          // For radial gradients
  radius?: number;           // For radial gradients
}

// ============================================================================
// Annotation Types with Metadata Support
// ============================================================================

export interface HighlighterAnnotation extends WhiteboardShapeBase {
  type: 'highlighter';
  points: WhiteboardPoint[];
  colorGradient: WhiteboardGradient;
  thickness: number;
  composite: 'multiply' | 'normal' | 'overlay';
  smoothing?: number;        // Optional smoothing factor
  capStyle?: 'round' | 'square' | 'butt';
  joinStyle?: 'round' | 'miter' | 'bevel';
}

export interface PenAnnotation extends WhiteboardShapeBase {
  type: 'pen';
  points: WhiteboardPoint[];
  color: string;
  thickness: number;
  smoothing?: number;
  capStyle?: 'round' | 'square' | 'butt';
  joinStyle?: 'round' | 'miter' | 'bevel';
}

export interface EraserAnnotation extends WhiteboardShapeBase {
  type: 'eraser';
  points: WhiteboardPoint[];
  thickness: number;
}

// ============================================================================
// Shape Types Union
// ============================================================================

export type WhiteboardAnnotation = 
  | HighlighterAnnotation 
  | PenAnnotation 
  | EraserAnnotation;

export type WhiteboardShape = 
  | WhiteboardAnnotation
  | TextShape
  | ImageShape
  | ShapeObject;

// ============================================================================
// Other Shape Types
// ============================================================================

export interface TextShape extends WhiteboardShapeBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width?: number;
  height?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface TextAnnotation extends TextShape {
  // Alias for compatibility
}

export interface EmojiObject extends WhiteboardShapeBase {
  type: 'emoji';
  emoji: string;
  size: number;
  native?: boolean;
}

export interface ImageShape extends WhiteboardShapeBase {
  type: 'image';
  url: string;
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  clipPath?: string;
}

export interface ShapeObject extends WhiteboardShapeBase {
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line';
  width?: number;
  height?: number;
  radius?: number;
  points?: WhiteboardPoint[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

// ============================================================================
// Store Types
// ============================================================================

export interface WhiteboardStore {
  // Canvas state
  shapes: Map<string, WhiteboardShape>;
  viewport: ViewportState;
  
  // Tool state
  activeTool: ToolType;
  color: string;
  size: number;
  opacity: number;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // Methods
  saveHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  
  // Selection
  selectedShapeIds: Set<string>;
  
  // Performance
  renderQuality: 'low' | 'medium' | 'high' | 'auto';
  enableGPU: boolean;
  
  // Collaboration (optional)
  collaborators?: Map<string, Collaborator>;
  cursorPositions?: Map<string, CursorPosition>;
}

// ============================================================================
// Tool Types
// ============================================================================

export type WhiteboardTool = 
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'shape'
  | 'image'
  | 'pan'
  | 'zoom'
  | 'laser'
  | 'emoji'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line';

export type ToolType = WhiteboardTool; // Alias for backward compatibility

export interface ToolState {
  type: ToolType;
  isActive: boolean;
  options: Record<string, any>;
}

// ============================================================================
// History Types
// ============================================================================

export interface WhiteboardHistoryEntry {
  shapes: Map<string, WhiteboardShape>;
  timestamp: number;
  action: string;
  data?: any;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  shapes: Map<string, WhiteboardShape>;
  viewport: ViewportState;
  metadata?: {
    userId?: string;
    deviceId?: string;
    sessionId?: string;
  };
}

// ============================================================================
// Collaboration Types (Optional)
// ============================================================================

export interface RemoteCursor {
  x: number;
  y: number;
  userId: string;
  userName?: string;
  color: string;
  timestamp: number;
  tool?: WhiteboardTool;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  lastSeen: number;
  isActive: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  tool: ToolType;
  timestamp: number;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  shapeCount: number;
  pointCount: number;
  memoryUsage?: number;
  gpuUsage?: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  viewport: ViewportState;
  dpr: number;
  quality: 'low' | 'medium' | 'high';
  debug?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface WhiteboardEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface PointerEventData {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  pointerType: string;
  isPrimary: boolean;
  buttons: number;
}

// ============================================================================
// Export Types for Testing
// ============================================================================

export interface TestingExports {
  toolState: any;
  metrics: any;
  [key: string]: any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface WhiteboardConfig {
  minZoom: number;
  maxZoom: number;
  enableTouch: boolean;
  enablePen: boolean;
  enableMouse: boolean;
  enableKeyboard: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  maxShapes: number;
  maxHistorySize: number;
  enableCollaboration: boolean;
  enableGPU: boolean;
  renderQuality: 'low' | 'medium' | 'high' | 'auto';
}

export const DEFAULT_WHITEBOARD_CONFIG: WhiteboardConfig = {
  minZoom: 0.1,
  maxZoom: 10,
  enableTouch: true,
  enablePen: true,
  enableMouse: true,
  enableKeyboard: true,
  autoSave: false,
  autoSaveInterval: 30000, // 30 seconds
  maxShapes: 10000,
  maxHistorySize: 100,
  enableCollaboration: false,
  enableGPU: true,
  renderQuality: 'auto',
};

// ============================================================================
// Constants
// ============================================================================

export const EMOJI_FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiOne Color", "Twemoji Mozilla", sans-serif';

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
