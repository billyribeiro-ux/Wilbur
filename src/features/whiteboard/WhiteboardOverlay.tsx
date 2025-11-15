/**
 * @deprecated This file has been replaced by /src/features/whiteboard/
 * 
 * REASON FOR RETIREMENT:
 * - Monolithic 1,191-line file violated Single Responsibility Principle
 * - No separation of concerns (canvas, toolbar, state all mixed)
 * - No Zustand store integration
 * - Missing pan/zoom viewport transforms
 * - No proper collaboration system
 * - No accessibility features
 * 
 * NEW ARCHITECTURE:
 * - WhiteboardOverlay.tsx (slim container)
 * - WhiteboardCanvas.tsx (rendering + interaction)
 * - WhiteboardToolbar.tsx (UI controls)
 * - whiteboardStore.ts (Zustand SSOT)
 * - utils/* (drawing, transform, export, undo/redo)
 * - hooks/* (pointer handling, shortcuts)
 * 
 * DO NOT USE THIS FILE. Import from /src/features/whiteboard/ instead.
 * ============================================================================
 * 
 * ZOOM-STYLE WHITEBOARD OVERLAY - Refactored for Zoom UI/UX
 * ============================================================================
 * Now with a toggle for both HORIZONTAL and VERTICAL draggable layouts.
 * NEW: Added toolbar scaling (zoom) controls.
 * ============================================================================
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faPen,
  faHighlighter,
  faEraser,
  faSquare,
  faCircle,
  faMinus,
  faArrowRight,
  faFont,
  faSmile,
  faMousePointer,
  faUndo,
  faRedo,
  faTrash,
  faDownload,
  faUpload, // <-- FIXED: Added missing import
  faTimes,
  faPalette,
  faEllipsisH,
  faEllipsisV,
  faPlus,
  faSearchMinus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn'; // Make sure this path is correct

import type {
  WhiteboardEvent,
  WhiteboardTool,
  WhiteboardPoint,
  WhiteboardShape,
  LineStyle,
} from './whiteboardTypes'; // Make sure this path is correct

export interface WhiteboardOverlayProps {
  isActive: boolean;
  canAnnotate: boolean;
  width: number;
  height: number;
  roomId: string;
  userId: string;
  onClose: () => void;
  onEventEmit?: (event: WhiteboardEvent) => void;
  incomingEvents?: WhiteboardEvent[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOOL_CONFIG: Record<
  WhiteboardTool,
  { label: string; icon: IconDefinition; defaultSize: number; opacity: number }
> = {
  select: { label: 'Select', icon: faMousePointer, defaultSize: 1, opacity: 1 },
  pen: { label: 'Pen', icon: faPen, defaultSize: 3, opacity: 1 },
  highlighter: {
    label: 'Highlighter',
    icon: faHighlighter,
    defaultSize: 14,
    opacity: 0.4,
  },
  eraser: { label: 'Eraser', icon: faEraser, defaultSize: 18, opacity: 1 },
  rectangle: { label: 'Rectangle', icon: faSquare, defaultSize: 2, opacity: 1 },
  circle: { label: 'Circle', icon: faCircle, defaultSize: 2, opacity: 1 },
  line: { label: 'Line', icon: faMinus, defaultSize: 2, opacity: 1 },
  arrow: { label: 'Arrow', icon: faArrowRight, defaultSize: 2, opacity: 1 },
  text: { label: 'Text', icon: faFont, defaultSize: 16, opacity: 1 },
  stamp: { label: 'Stamp', icon: faSmile, defaultSize: 32, opacity: 1 },
};

const COLORS = [
  '#000000', '#FFFFFF', '#FF5555', '#FFC43D', '#36CFC9',
  '#2E9BFF', '#A855F7', '#10B981', '#F97316', '#EC4899',
];

const STAMPS = [
  '⭐', '✓', '✗', '❤️', '👍', '👎', '💡', '⚠️', '📌', '🎯', '🔥', '💯',
];

export const WhiteboardOverlay = memo(function WhiteboardOverlay({
  isActive,
  canAnnotate,
  width,
  height,
  roomId,
  userId,
  onClose,
  onEventEmit,
  incomingEvents = [],
}: WhiteboardOverlayProps) {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  // Tool state
  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [fillColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<number>(3);
  const [lineStyle] = useState<LineStyle>('solid');
  const [fontSize] = useState<number>(16);
  const [selectedStamp] = useState<string>(STAMPS[0]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<Map<string, WhiteboardShape>>(new Map());
  const [history, setHistory] = useState<Map<string, WhiteboardShape>[]>([
    new Map(),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentShapeIdRef = useRef<string | null>(null);

  // Process incoming events from other users (after state declarations)
  useEffect(() => {
    if (!incomingEvents || incomingEvents.length === 0) return;
    
    incomingEvents.forEach((event) => {
      try {
        switch (event.type) {
          case 'stroke:start':
            if ('strokeId' in event.payload && 'tool' in event.payload && 'start' in event.payload) {
              const newShape: WhiteboardShape = {
                id: event.payload.strokeId,
                type: event.payload.tool,
                color: event.payload.color,
                size: event.payload.size,
                lineStyle: 'solid',
                opacity: TOOL_CONFIG[event.payload.tool]?.opacity ?? 1,
                points: [event.payload.start],
                userId: event.userId,
                timestamp: event.timestamp,
              };
              setShapes(prev => new Map(prev).set(newShape.id, newShape));
            }
            break;
            
          case 'stroke:update':
            if ('strokeId' in event.payload && 'points' in event.payload) {
              const payload = event.payload as { strokeId: string; points: WhiteboardPoint[] };
              setShapes(prev => {
                const next = new Map(prev);
                const shape = next.get(payload.strokeId);
                if (!shape) return prev;
                
                const updatedShape = { ...shape };
                if (['rectangle', 'circle', 'line', 'arrow'].includes(shape.type)) {
                  updatedShape.points = [shape.points[0], ...payload.points];
                } else {
                  updatedShape.points = [...shape.points, ...payload.points];
                }
                next.set(payload.strokeId, updatedShape);
                return next;
              });
            }
            break;
            
          case 'stroke:end':
            // No action needed, shape is already finalized by updates
            break;
            
          case 'stroke:clear':
            setShapes(new Map());
            setHistory([new Map()]);
            setHistoryIndex(0);
            break;
            
          case 'stroke:undo':
            // NOTE: This is a simplified, non-robust way to handle remote undo
            if (historyIndex > 0) {
              const newIndex = historyIndex - 1;
              setHistoryIndex(newIndex);
              setShapes(new Map(history[newIndex]));
            }
            break;
            
          case 'stroke:redo':
            // NOTE: This is a simplified, non-robust way to handle remote redo
            if (historyIndex < history.length - 1) {
              const newIndex = historyIndex + 1;
              setHistoryIndex(newIndex);
              setShapes(new Map(history[newIndex]));
            }
            break;
            
          case 'shape:add':
            if ('shape' in event.payload && event.payload.shape) {
              const shape = event.payload.shape;
              setShapes(prev => new Map(prev).set(shape.id, shape));
            }
            break;
            
          case 'shape:delete':
            if ('shapeId' in event.payload) {
              const payload = event.payload as { shapeId: string };
              setShapes(prev => {
                const next = new Map(prev);
                next.delete(payload.shapeId);
                return next;
              });
            }
            break;
            
          case 'canvas:save':
          case 'canvas:export':
            break; // No action needed
            
          default:
            console.warn('[Whiteboard] Unknown event type:', event.type);
        }
      } catch (error) {
        console.error('[Whiteboard] Error processing incoming event:', error, event);
      }
    });
  }, [incomingEvents, history, historyIndex]);

  // Text input state
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [toolbarScale, setToolbarScale] = useState(1);

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: 24,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize canvas context with error handling
  useEffect(() => {
    try {
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (!context) {
          console.error('[Whiteboard] Failed to get 2D context');
          return;
        }
        ctx.current = context;
      }
    } catch (error) {
      console.error('[Whiteboard] Canvas initialization error:', error);
    }
  }, []);

  // ============================================================================
  // DRAWING FUNCTIONS - Core Logic
  // ============================================================================

  const drawShape = useCallback(
    (
      context: CanvasRenderingContext2D,
      shape: WhiteboardShape,
      canvasWidth: number,
      canvasHeight: number,
    ) => {
      if (shape.points.length === 0) return;
      const scaledPoints = shape.points.map((p) => ({
        x: p.x * canvasWidth,
        y: p.y * canvasHeight,
      }));
      context.save();
      context.globalAlpha = shape.opacity;
      context.strokeStyle = shape.color;
      context.lineWidth = shape.size;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (shape.lineStyle === 'dashed') context.setLineDash([10, 5]);
      else if (shape.lineStyle === 'dotted') context.setLineDash([2, 3]);
      else context.setLineDash([]);
      switch (shape.type) {
        case 'pen':
        case 'highlighter':
          if (scaledPoints.length < 2) break;
          context.beginPath();
          context.moveTo(scaledPoints[0].x, scaledPoints[0].y);
          scaledPoints.slice(1).forEach((p) => context.lineTo(p.x, p.y));
          context.stroke();
          break;
        case 'eraser':
          context.globalCompositeOperation = 'destination-out';
          if (scaledPoints.length < 2) break;
          context.beginPath();
          context.moveTo(scaledPoints[0].x, scaledPoints[0].y);
          scaledPoints.slice(1).forEach((p) => context.lineTo(p.x, p.y));
          context.stroke();
          context.globalCompositeOperation = 'source-over';
          break;
        case 'line':
          if (scaledPoints.length < 2) break;
          context.beginPath();
          context.moveTo(scaledPoints[0].x, scaledPoints[0].y);
          context.lineTo(
            scaledPoints[scaledPoints.length - 1].x,
            scaledPoints[scaledPoints.length - 1].y,
          );
          context.stroke();
          break;
        case 'arrow': {
          if (scaledPoints.length < 2) break;
          const start = scaledPoints[0];
          const end = scaledPoints[scaledPoints.length - 1];
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = shape.size * 5;
          context.beginPath();
          context.moveTo(end.x, end.y);
          context.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6),
          );
          context.moveTo(end.x, end.y);
          context.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6),
          );
          context.stroke();
          break;
        }
        case 'rectangle': {
          if (scaledPoints.length < 2) break;
          const rectStart = scaledPoints[0];
          const rectEnd = scaledPoints[scaledPoints.length - 1];
          const rectWidth = rectEnd.x - rectStart.x;
          const rectHeight = rectEnd.y - rectStart.y;
          if (shape.fillColor) {
            context.fillStyle = shape.fillColor;
            context.globalAlpha = 0.5;
            context.fillRect(rectStart.x, rectStart.y, rectWidth, rectHeight);
            context.globalAlpha = shape.opacity;
          }
          context.strokeRect(rectStart.x, rectStart.y, rectWidth, rectHeight);
          break;
        }
        case 'circle': {
          if (scaledPoints.length < 2) break;
          const circleStart = scaledPoints[0];
          const circleEnd = scaledPoints[scaledPoints.length - 1];
          const radius = Math.sqrt(
            Math.pow(circleEnd.x - circleStart.x, 2) +
              Math.pow(circleEnd.y - circleStart.y, 2),
          );
          context.beginPath();
          context.arc(circleStart.x, circleStart.y, radius, 0, 2 * Math.PI);
          if (shape.fillColor) {
            context.fillStyle = shape.fillColor;
            context.globalAlpha = 0.5;
            context.fill();
            context.globalAlpha = shape.opacity;
          }
          context.stroke();
          break;
        }
        case 'text':
          if (shape.text && scaledPoints.length > 0) {
            context.font = `${shape.fontSize || 16}px ${
              shape.fontFamily || 'Arial'
            }`;
            context.fillStyle = shape.color;
            context.globalAlpha = 1;
            context.fillText(shape.text, scaledPoints[0].x, scaledPoints[0].y);
          }
          break;
        case 'stamp':
          if (shape.stampEmoji && scaledPoints.length > 0) {
            context.font = `${shape.size}px Arial`;
            context.globalAlpha = 1;
            context.fillText(
              shape.stampEmoji,
              scaledPoints[0].x,
              scaledPoints[0].y,
            );
          }
          break;
      }
      context.restore();
    },
    [],
  );

  const redrawCanvas = useCallback(() => {
    try {
      const context = ctx.current;
      if (!context) return;
      context.clearRect(0, 0, width, height);
      shapes.forEach((shape) => {
        try {
          drawShape(context, shape, width, height);
        } catch (shapeError) {
          console.error('[Whiteboard] Error drawing shape:', shapeError, shape);
        }
      });
    } catch (error) {
      console.error('[Whiteboard] Canvas redraw error:', error);
    }
  }, [width, height, shapes, drawShape]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ============================================================================
  // DRAWING HANDLERS - Core Logic
  // ============================================================================

  const startDrawing = useCallback(
    (point: WhiteboardPoint) => {
      if (!canAnnotate) return;
      if (tool === 'text') {
        setTextInput({ x: point.x * width, y: point.y * height, value: '' });
        return;
      }
      // FIXED: Use robust crypto.randomUUID() fallback
      const shapeId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newShape: WhiteboardShape = {
        id: shapeId,
        type: tool,
        color: tool === 'eraser' ? '#000000' : color,
        fillColor: fillColor,
        size,
        lineStyle,
        opacity: TOOL_CONFIG[tool].opacity,
        points: [point],
        stampEmoji: tool === 'stamp' ? selectedStamp : undefined,
        userId,
        timestamp: Date.now(),
      };
      setShapes((prev) => new Map(prev).set(shapeId, newShape));
      currentShapeIdRef.current = shapeId;
      setIsDrawing(true);
      onEventEmit?.({
        type: 'stroke:start',
        roomId,
        userId,
        timestamp: Date.now(),
        payload: {
          strokeId: shapeId,
          tool,
          color: newShape.color,
          size,
          start: point,
        },
      });
    },
    // FIXED: Added closing );
    [
      canAnnotate, tool, color, fillColor, size, lineStyle, selectedStamp,
      width, height, userId, onEventEmit, roomId,
    ],
  );

  // Performance optimization: Use RAF for smooth drawing
  const rafIdDrawing = useRef<number>(0);
  const pendingPointRef = useRef<WhiteboardPoint | null>(null);
  
  // Microsoft pattern: Track active drag cleanup for hard-cancel
  const activeDragCleanupRef = useRef<(() => void) | null>(null);
  
  // Cleanup RAF on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (rafIdDrawing.current) {
        cancelAnimationFrame(rafIdDrawing.current);
        rafIdDrawing.current = 0;
      }
    };
  }, []);

  const continueDrawing = useCallback(
    (point: WhiteboardPoint) => {
      if (!isDrawing || !canAnnotate || !currentShapeIdRef.current) return;
      
      pendingPointRef.current = point;
      
      if (rafIdDrawing.current) {
        cancelAnimationFrame(rafIdDrawing.current);
      }
      
      rafIdDrawing.current = requestAnimationFrame(() => {
        const currentPoint = pendingPointRef.current;
        if (!currentPoint) return;
        
        const shapeId = currentShapeIdRef.current;
        if (!shapeId) return;
        
        setShapes((prev) => {
          const next = new Map(prev);
          const shape = next.get(shapeId);
          if (!shape) return prev;
          
          const updatedShape = { ...shape };
          if (['rectangle', 'circle', 'line', 'arrow'].includes(shape.type)) {
            updatedShape.points = [shape.points[0], currentPoint];
          } else {
            updatedShape.points = [...shape.points, currentPoint];
          }
          next.set(shapeId, updatedShape);
          return next;
        });
        
        onEventEmit?.({
          type: 'stroke:update',
          roomId,
          userId,
          timestamp: Date.now(),
          payload: { strokeId: shapeId, points: [currentPoint] },
        });
        
        pendingPointRef.current = null;
        rafIdDrawing.current = 0;
      });
    },
    // FIXED: Added closing );
    [isDrawing, canAnnotate, onEventEmit, roomId, userId],
  );

  // FIXED: This entire function was broken/missing
  const stopDrawing = useCallback(() => {
    // Cancel any pending RAF from continueDrawing
    if (rafIdDrawing.current) {
      cancelAnimationFrame(rafIdDrawing.current);
      rafIdDrawing.current = 0;
    }
    pendingPointRef.current = null;
    
    if (!isDrawing || !currentShapeIdRef.current) {
        setIsDrawing(false);
        return;
    }
    const shapeId = currentShapeIdRef.current;
    setIsDrawing(false);
    
    setHistory((prev) => {
        const currentHistory = prev.slice(0, historyIndex + 1);
        const newHistoryState = new Map(shapes);
        
        currentHistory.push(newHistoryState);
        if (currentHistory.length > 50) {
            currentHistory.shift();
        }
        setHistoryIndex(currentHistory.length - 1);
        return currentHistory;
    });

    onEventEmit?.({
        type: 'stroke:end',
        roomId,
        userId,
        timestamp: Date.now(),
        payload: { strokeId: shapeId },
    });
    currentShapeIdRef.current = null;
  }, [isDrawing, shapes, historyIndex, onEventEmit, roomId, userId]);

  const handleCanvasInteraction = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      
      // If a previous drag didn't finish, clean it first
      activeDragCleanupRef.current?.();
      activeDragCleanupRef.current = null;
      
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      
      // Get point coordinates based on event type
      const getPoint = (evt: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
        if ('touches' in evt) {
          return {
            x: (evt.touches[0].clientX - rect.left) / rect.width,
            y: (evt.touches[0].clientY - rect.top) / rect.height,
          };
        } else {
          return {
            x: (evt.clientX - rect.left) / rect.width,
            y: (evt.clientY - rect.top) / rect.height,
          };
        }
      };
      
      const point = getPoint(event);
      
      // Check if pointer events are supported
      const isPointer = 'pointerType' in event;
      
      const handleMove = (moveEvent: PointerEvent | MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        
        const movePoint = 'touches' in moveEvent 
          ? {
              x: (moveEvent.touches[0].clientX - rect.left) / rect.width,
              y: (moveEvent.touches[0].clientY - rect.top) / rect.height,
            }
          : {
              x: (moveEvent.clientX - rect.left) / rect.width,
              y: (moveEvent.clientY - rect.top) / rect.height,
            };
        
        continueDrawing(movePoint);
      };
      
      const handleEnd = () => {
        stopDrawing();
        activeDragCleanupRef.current = null;
        
        // Remove listeners
        if (isPointer) {
          canvas.removeEventListener('pointermove', handleMove as EventListener);
          canvas.removeEventListener('pointerup', handleEnd as EventListener);
          canvas.removeEventListener('pointerleave', handleEnd as EventListener);
        } else {
          canvas.removeEventListener('mousemove', handleMove as EventListener);
          canvas.removeEventListener('mouseup', handleEnd as EventListener);
          canvas.removeEventListener('mouseleave', handleEnd as EventListener);
          canvas.removeEventListener('touchmove', handleMove as EventListener);
          canvas.removeEventListener('touchend', handleEnd as EventListener);
          canvas.removeEventListener('touchcancel', handleEnd as EventListener);
        }
      };
      
      // Store cleanup function
      activeDragCleanupRef.current = handleEnd;
      
      try {
        // Attach appropriate event listeners
        if (isPointer) {
          canvas.addEventListener('pointermove', handleMove as EventListener, { passive: false });
          canvas.addEventListener('pointerup', handleEnd as EventListener, { once: true });
          canvas.addEventListener('pointerleave', handleEnd as EventListener, { once: true });
        } else {
          canvas.addEventListener('mousemove', handleMove as EventListener, { passive: false });
          canvas.addEventListener('mouseup', handleEnd as EventListener, { once: true });
          canvas.addEventListener('mouseleave', handleEnd as EventListener, { once: true });
          canvas.addEventListener('touchmove', handleMove as EventListener, { passive: false });
          canvas.addEventListener('touchend', handleEnd as EventListener, { once: true });
          canvas.addEventListener('touchcancel', handleEnd as EventListener, { once: true });
        }
      } catch (error) {
        // Ensure cleanup runs even if event attachment fails
        handleEnd();
        throw error;
      }
      
      startDrawing(point);
    },
    [startDrawing, continueDrawing, stopDrawing, isDrawing],
  );


  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleUndo = useCallback(() => {
    if (!canAnnotate || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setShapes(new Map(history[newIndex]));
    onEventEmit?.({ type: 'stroke:undo', roomId, userId, timestamp: Date.now(), payload: {} });
  }, [canAnnotate, historyIndex, history, onEventEmit, roomId, userId]);

  const handleRedo = useCallback(() => {
    if (!canAnnotate || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setShapes(new Map(history[newIndex]));
    onEventEmit?.({ type: 'stroke:redo', roomId, userId, timestamp: Date.now(), payload: {} });
  }, [canAnnotate, historyIndex, history, onEventEmit, roomId, userId]);

  const handleClear = useCallback(() => {
    if (!canAnnotate) return;
    const newShapes = new Map();
    setShapes(newShapes);
    setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newShapes);
        if (newHistory.length > 50) newHistory.shift();
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
    });
    onEventEmit?.({ type: 'stroke:clear', roomId, userId, timestamp: Date.now(), payload: {} });
  }, [canAnnotate, onEventEmit, roomId, userId, historyIndex]);

  // Implement proper load functionality
  const handleLoad = useCallback(() => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (!data.shapes || !Array.isArray(data.shapes)) {
              throw new Error('Invalid whiteboard file format');
            }
            
            // Convert array to Map
            const loadedShapes = new Map<string, WhiteboardShape>();
            data.shapes.forEach((shape: WhiteboardShape) => {
              if (shape.id) {
                loadedShapes.set(shape.id, shape);
              }
            });
            
            setShapes(loadedShapes);
            
            // Update history
            setHistory(prev => {
              const newHistory = prev.slice(0, historyIndex + 1);
              newHistory.push(loadedShapes);
              if (newHistory.length > 50) newHistory.shift();
              setHistoryIndex(newHistory.length - 1);
              return newHistory;
            });
            
            console.log('[Whiteboard] Successfully loaded', loadedShapes.size, 'shapes');
          } catch (error) {
            console.error('[Whiteboard] Failed to load file:', error);
            alert('Failed to load whiteboard file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      console.error('[Whiteboard] Load failed:', error);
      alert('Failed to open file picker.');
    }
  }, [historyIndex]);

  const handleSave = useCallback(() => {
    try {
      if (!canvasRef.current) {
        console.warn('[Whiteboard] Cannot save: canvas ref is null');
        return;
      }
      
      // Save as JSON for full fidelity
      const saveData = {
        version: '1.0',
        timestamp: Date.now(),
        roomId,
        userId,
        shapes: Array.from(shapes.values()),
      };
      
      const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      onEventEmit?.({ type: 'canvas:save', roomId, userId, timestamp: Date.now(), payload: {} });
    } catch (error) {
      console.error('[Whiteboard] Save failed:', error);
      alert('Failed to save whiteboard. Please try again.');
    }
  }, [roomId, userId, shapes, onEventEmit]);
  
  // Add export as image function
  const handleExportImage = useCallback(() => {
    try {
      if (!canvasRef.current) {
        console.warn('[Whiteboard] Cannot export: canvas ref is null');
        return;
      }
      const dataURL = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
      onEventEmit?.({ type: 'canvas:export', roomId, userId, timestamp: Date.now(), payload: {} });
    } catch (error) {
      console.error('[Whiteboard] Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  }, [roomId, userId, onEventEmit]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput?.value.trim()) {
      setTextInput(null);
      return;
    }
    // FIXED: Use robust crypto.randomUUID() fallback
    const shapeId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newShape: WhiteboardShape = {
      id: shapeId, type: 'text', color, size: fontSize, lineStyle: 'solid',
      opacity: 1, points: [{ x: textInput.x / width, y: textInput.y / height }],
      text: textInput.value, fontSize, fontFamily: 'Arial', userId, timestamp: Date.now()
    };
    const nextShapes = new Map(shapes).set(shapeId, newShape);
    setShapes(nextShapes);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(nextShapes);
      if (newHistory.length > 50) newHistory.shift();
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    setTextInput(null);
  }, [textInput, color, fontSize, width, height, userId, shapes, historyIndex]);

  // Keyboard shortcuts (This was a new feature in the broken file, now integrated)
  useEffect(() => {
    if (!isActive || !canAnnotate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((ctrlKey && e.shiftKey && e.key === 'z') || (ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Use Ctrl/Cmd + Backspace for a "safer" clear
      if (ctrlKey && e.key === 'Backspace') {
        e.preventDefault();
        if (confirm('Are you sure you want to clear the entire whiteboard?')) {
          handleClear();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'p': setTool('pen'); setSize(TOOL_CONFIG.pen.defaultSize); break;
          case 'h': setTool('highlighter'); setSize(TOOL_CONFIG.highlighter.defaultSize); break;
          case 'e': setTool('eraser'); setSize(TOOL_CONFIG.eraser.defaultSize); break;
          case 'r': setTool('rectangle'); setSize(TOOL_CONFIG.rectangle.defaultSize); break;
          case 'c': setTool('circle'); setSize(TOOL_CONFIG.circle.defaultSize); break;
          case 'l': setTool('line'); setSize(TOOL_CONFIG.line.defaultSize); break;
          case 'a': setTool('arrow'); setSize(TOOL_CONFIG.arrow.defaultSize); break;
          case 't': setTool('text'); setSize(TOOL_CONFIG.text.defaultSize); break;
          case 's': 
            if (!ctrlKey) { 
              setTool('stamp'); 
              setSize(TOOL_CONFIG.stamp.defaultSize); 
            } 
            break;
          case 'v': 
            // TODO: Implement select tool functionality
            console.warn('[Whiteboard] Select tool not yet implemented');
            setTool('select'); 
            setSize(TOOL_CONFIG.select.defaultSize); 
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, canAnnotate, handleUndo, handleRedo, handleClear, onClose]);

  // ============================================================================
  // UI HANDLERS (Toolbar)
  // ============================================================================
  
  const handleToggleOrientation = useCallback(() => {
    setIsVertical(prev => {
      const nextIsVertical = !prev;
      if (typeof window !== 'undefined') {
        if (nextIsVertical) {
          setToolbarPos({ x: 24, y: window.innerHeight / 2 });
        } else {
          setToolbarPos({ x: window.innerWidth / 2, y: 24 });
        }
      }
      return nextIsVertical;
    });
  }, []);

  const handleZoomIn = () => setToolbarScale(s => Math.min(s + 0.2, 2.0));
  const handleZoomOut = () => setToolbarScale(s => Math.max(s - 0.2, 0.6));

  if (!isActive) {
    return null;
  }

  // Common button class
  const toolButtonClass = cn(
    'flex items-center justify-center rounded-lg transition-all',
    isVertical 
      ? 'w-12 h-12 bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300' 
      : 'w-10 h-10 text-white hover:bg-gray-700'
  );
  
  const toolButtonActiveClass = isVertical ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-auto"
        onPointerDown={handleCanvasInteraction}
        onMouseDown={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
        role="img"
        aria-label="Whiteboard drawing canvas"
        tabIndex={canAnnotate ? 0 : -1}
      />

      {/* Text Input Overlay */}
      {textInput && (
        <div
          className="absolute pointer-events-auto"
          style={{ left: textInput.x, top: textInput.y }}
        >
          <input
            type="text"
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
              if (e.key === 'Escape') setTextInput(null);
            }}
            onBlur={handleTextSubmit}
            autoFocus
            className="px-2 py-1 bg-white border-2 border-blue-500 rounded text-black shadow-lg"
            style={{ fontSize: `${fontSize}px` }}
            placeholder="Type text..."
          />
        </div>
      )}

      {/* Toolbar - DYNAMIC (Draggable, Horizontal/Vertical, Scalable) */}
      {canAnnotate && (
        <div
          className="absolute pointer-events-auto select-none"
          style={{
            left: `${toolbarPos.x}px`,
            top: `${toolbarPos.y}px`,
            transform: `${isVertical ? 'translateY(-50%)' : 'translateX(-50%)'} scale(${toolbarScale})`,
            transformOrigin: isVertical ? '0 50%' : '50% 0',
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setIsDragging(true);
            setDragStart({
              x: e.clientX - toolbarPos.x,
              y: e.clientY - toolbarPos.y,
            });
          }}
          onPointerMove={(e) => {
            if (isDragging) {
              setToolbarPos({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
              });
            }
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)} // Added for robustness
          onMouseLeave={() => setIsDragging(false)} // Added for robustness
        >
          <div className={cn(
            "flex gap-2 p-3 rounded-xl shadow-2xl cursor-move relative",
            isVertical 
              ? 'flex-col bg-white border border-gray-200' 
              : 'flex-row items-center bg-gray-900/90 border border-gray-700'
          )}>
            
            {/* --- Tools Group --- */}
            {(Object.keys(TOOL_CONFIG) as WhiteboardTool[]).map((t) => {
              const { icon, label } = TOOL_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    toolButtonClass,
                    tool === t && toolButtonActiveClass,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTool(t);
                    setSize(TOOL_CONFIG[t].defaultSize);
                  }}
                  title={label}
                >
                  <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                </button>
              );
            })}

            {/* --- Separator --- */}
            <div className={cn( "mx-1", isVertical ? 'border-t border-gray-300 w-8' : 'border-l border-gray-600 h-8' )} />

            {/* --- Color Picker --- */}
            {/* FIXED: This block is now correct */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={cn( toolButtonClass, isVertical ? 'w-12 h-12' : 'w-10 h-10 p-2' )}
                title="Color"
              >
                {isVertical ? (
                  <FontAwesomeIcon icon={faPalette} className="w-5 h-5" style={{ color: color }} />
                ) : (
                  <div
                    className="w-full h-full rounded-sm border-2 border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
              {showColorPicker && (
                <div className={cn(
                  "absolute p-3 rounded-lg shadow-xl grid grid-cols-5 gap-2 z-10",
                  isVertical
                    ? 'left-16 top-0 bg-white border border-gray-300'
                    : 'left-1/2 -translate-x-1/2 top-14 bg-gray-800 border border-gray-700'
                )}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setShowColorPicker(false); }}
                      className={cn(
                        "w-7 h-7 rounded-md border-2 hover:scale-110 transition-transform",
                         isVertical ? 'border-gray-300' : 'border-gray-400'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* --- Separator --- */}
            <div className={cn( "mx-1", isVertical ? 'border-t border-gray-300 w-8' : 'border-l border-gray-600 h-8' )} />

            {/* --- Actions --- */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={cn(toolButtonClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
              title="Undo (Ctrl+Z)"
            >
              <FontAwesomeIcon icon={faUndo} className="w-5 h-5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={cn(toolButtonClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
              title="Redo (Ctrl+Y)"
            >
              <FontAwesomeIcon icon={faRedo} className="w-5 h-5" />
            </button>
            <button
              onClick={handleClear}
              // FIXED: Simplified disabled logic
              disabled={shapes.size === 0}
              className={cn(
                toolButtonClass, 
                'disabled:opacity-30 disabled:cursor-not-allowed',
                isVertical ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-800/50'
              )}
              title="Clear All (Ctrl+Backspace)"
            >
              <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className={cn(
                toolButtonClass,
                isVertical ? 'text-green-600 hover:bg-green-50' : 'text-green-500 hover:bg-green-800/50'
              )}
              title="Save as JSON"
            >
              <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
            </button>
            <button
              onClick={handleLoad}
              className={cn(
                toolButtonClass,
                isVertical ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-500 hover:bg-blue-800/50'
              )}
              title="Load from JSON"
            >
              <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportImage}
              className={cn(
                toolButtonClass,
                isVertical ? 'text-purple-600 hover:bg-purple-50' : 'text-purple-500 hover:bg-purple-800/50'
              )}
              title="Export as PNG"
            >
              <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            </button>

            {/* --- Separator --- */}
            <div className={cn( "mx-1", isVertical ? 'border-t border-gray-300 w-8' : 'border-l border-gray-600 h-8' )} />
            
            {/* --- Zoom Controls --- */}
            <button
              onClick={handleZoomOut}
              disabled={toolbarScale <= 0.6}
              className={cn(toolButtonClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
              title="Make bar smaller"
            >
              <FontAwesomeIcon icon={faSearchMinus} className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={toolbarScale >= 2.0}
              className={cn(toolButtonClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
              title="Make bar bigger"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
            </button>

            {/* --- Separator --- */}
            <div className={cn( "mx-1", isVertical ? 'border-t border-gray-300 w-8' : 'border-l border-gray-600 h-8' )} />

            {/* --- Orientation Toggle --- */}
            <button
              onClick={handleToggleOrientation}
              className={cn(toolButtonClass)}
              title={isVertical ? "Switch to horizontal bar" : "Switch to vertical bar"}
            >
              <FontAwesomeIcon icon={isVertical ? faEllipsisH : faEllipsisV} className="w-5 h-5" />
            </button>

            {/* --- Close Button --- */}
            <button
              type="button"
              className={cn( toolButtonClass, 'bg-red-600 text-white hover:bg-red-700' )}
              onClick={onClose}
              title="Close Whiteboard (Esc)"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default WhiteboardOverlay;