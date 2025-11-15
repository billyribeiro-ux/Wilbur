// ============================================================================
// WHITEBOARD TYPES - Microsoft Enterprise Standard
// ============================================================================
// Complete type definitions for Zoom-level whiteboard functionality
// ============================================================================

export type WhiteboardTool = 
  | 'select'      // Select and move objects
  | 'pen'         // Freehand drawing
  | 'highlighter' // Semi-transparent marker
  | 'eraser'      // Erase strokes
  | 'rectangle'   // Draw rectangles
  | 'circle'      // Draw circles
  | 'line'        // Draw straight lines
  | 'arrow'       // Draw arrows
  | 'text'        // Add text
  | 'stamp';      // Add emoji stamps

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface WhiteboardPoint {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
}

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
  stampEmoji?: string;
  selected?: boolean;
  locked?: boolean;
  userId?: string;
  timestamp?: number;
}

export interface WhiteboardEvent {
  type: 
    | 'shape:add'
    | 'shape:update'
    | 'shape:delete'
    | 'shape:select'
    | 'shape:move'
    | 'stroke:start'
    | 'stroke:update'
    | 'stroke:end'
    | 'stroke:undo'
    | 'stroke:redo'
    | 'stroke:clear'
    | 'canvas:save'
    | 'canvas:export';
  roomId: string;
  userId: string;
  timestamp: number;
  payload: WhiteboardEventPayload;
}

export type WhiteboardEventPayload =
  | {
      // Shape add/update
      shape: WhiteboardShape;
    }
  | {
      // Shape delete/select
      shapeId: string;
    }
  | {
      // Shape move
      shapeId: string;
      deltaX: number;
      deltaY: number;
    }
  | {
      // Stroke start (legacy support)
      strokeId: string;
      tool: WhiteboardTool;
      color: string;
      size: number;
      start: WhiteboardPoint;
    }
  | {
      // Stroke update (legacy support)
      strokeId: string;
      points: WhiteboardPoint[];
    }
  | {
      // Stroke end/undo (legacy support)
      strokeId: string;
    }
  | Record<string, never>; // Empty payload for clear/redo

export interface WhiteboardState {
  shapes: Map<string, WhiteboardShape>;
  selectedShapeIds: Set<string>;
  history: WhiteboardHistoryEntry[];
  historyIndex: number;
}

export interface WhiteboardHistoryEntry {
  shapes: Map<string, WhiteboardShape>;
  timestamp: number;
  action: string;
}

export interface WhiteboardConfig {
  maxHistorySize: number;
  defaultTool: WhiteboardTool;
  defaultColor: string;
  defaultSize: number;
  enableCollaboration: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
}

export const DEFAULT_WHITEBOARD_CONFIG: WhiteboardConfig = {
  maxHistorySize: 50,
  defaultTool: 'pen',
  defaultColor: '#000000', // Black - visible on white background
  defaultSize: 3,
  enableCollaboration: true,
  enableAutoSave: false,
  autoSaveInterval: 30000 // 30 seconds
};
