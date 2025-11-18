// ============================================================================
// WHITEBOARD CANVAS - Main Drawing Surface
// ============================================================================
// Canvas2D rendering with pointer interaction
// ============================================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { usePointerDrawing } from '../hooks/usePointerDrawing';
import { drawShape } from '../utils/drawPrimitives';
import { TextEditor } from './TextEditor';
import { EmojiPicker } from './EmojiPicker';
import { screenToWorld, worldToScreen, applyTransform, resetTransform } from '../utils/transform';
import { measureText } from '../utils/textLayout';
import type { WhiteboardPoint } from '../types';
import { 
  handleTextPointerMove,
  handleTextPointerUp,
  activateTextTool,
  deactivateTextTool,
} from '../tools/TextTool';
import {
  handleHighlighterPointerDown,
  handleHighlighterPointerMove,
  handleHighlighterPointerUp,
  activateHighlighterTool,
  deactivateHighlighterTool,
} from '../tools/HighlighterTool';
import {
  handleEraserPointerDown,
  handleEraserPointerMove,
  handleEraserPointerUp,
  activateEraserTool,
  deactivateEraserTool,
} from '../tools/EraserTool';
import {
  handleRectanglePointerDown,
  handleRectanglePointerMove,
  handleRectanglePointerUp,
  activateRectangleTool,
  deactivateRectangleTool,
} from '../tools/RectangleTool';
import {
  handleLinePointerDown,
  handleLinePointerMove,
  handleLinePointerUp,
  activateLineTool,
  deactivateLineTool,
} from '../tools/LineTool';
import {
  handleArrowPointerDown,
  handleArrowPointerMove,
  handleArrowPointerUp,
  activateArrowTool,
  deactivateArrowTool,
} from '../tools/ArrowTool';

interface WhiteboardCanvasProps {
  width: number;   // CSS pixels
  height: number;  // CSS pixels
  canAnnotate: boolean;
}

export function WhiteboardCanvas({ width, height, canAnnotate }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [textEditorPosition, setTextEditorPosition] = useState<WhiteboardPoint | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingEmojiPosition, setPendingEmojiPosition] = useState<WhiteboardPoint | null>(null);
  
  const shapes = useWhiteboardStore((s: any) => s.shapes);
  const viewport = useWhiteboardStore((s: any) => s.viewport);
  const tool = useWhiteboardStore((s: any) => s.tool);
  const addShape = useWhiteboardStore((s: any) => s.addShape);
  const setPan = useWhiteboardStore((s: any) => s.setPan);
  const setZoom = useWhiteboardStore((s: any) => s.setZoom);
  
  const pointerHandlers = usePointerDrawing(canvasRef, canAnnotate);
  const { handlePointerDown, handlePointerMove, handlePointerUp } = pointerHandlers;
  
  // Pan state for hand tool
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  
  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas to white background (device pixels)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Viewport width/height must be CSS pixels; DPR is handled inside applyTransform
    const viewportState = { ...viewport, width, height };

    // Set DPR + viewport transform
    applyTransform(ctx, viewportState);

    // Draw all shapes in world space
    shapes.forEach((shape: import('../types').WhiteboardShape) => {
      drawShape(ctx, shape, viewportState);
    });

    // Reset transform after drawing
    resetTransform(ctx);
  }, [shapes, viewport, width, height]);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);
  
  // Handle pan with hand tool
  const handlePanStart = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== 'hand') return;
    
    isPanning.current = true;
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [tool]);
  
  const handlePanMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPanning.current) return;
    
    const dx = e.clientX - lastPanPoint.current.x;
    const dy = e.clientY - lastPanPoint.current.y;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // IMPORTANT: dx/dy are in CSS pixels; normalize by CSS width/height, not backing store
    setPan(
      viewport.panX + dx / width,
      viewport.panY + dy / height
    );
    
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
  }, [viewport, setPan, width, height]);
  
  const handlePanEnd = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPanning.current) return;
    
    isPanning.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);
  
  // Handle zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const newZoom = viewport.zoom * (1 + delta);
    
    setZoom(newZoom);
  }, [viewport.zoom, setZoom]);
  
  // Handle text tool click
  const handleTextClick = useCallback((e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; // CSS pixels
    const y = e.clientY - rect.top;  // CSS pixels
    
    // Viewport width/height MUST be CSS pixels for screenToWorld
    const worldPos = screenToWorld(x, y, {
      ...viewport,
      width,
      height,
    });
    
    setTextEditorPosition(worldPos);
  }, [viewport, width, height]);
  
  const handleTextComplete = useCallback((text: string) => {
    const store = useWhiteboardStore.getState();
    if (editingTextId) {
      if (text.trim()) {
        store.updateShape(editingTextId, { text, updatedAt: Date.now() });
        store.saveHistory('edit-text');
      }
      setEditingTextId(null);
      setTextEditorPosition(null);
      return;
    }

    if (text.trim() && textEditorPosition) {
      const newShape = {
        id: `text-${Date.now()}`,
        type: 'text' as const,
        color: store.color,
        size: store.fontSize,
        opacity: 1,
        lineStyle: 'solid' as const,
        points: [textEditorPosition],
        text,
        fontSize: store.fontSize,
        fontFamily: store.fontFamily,
        fontWeight: store.fontWeight,
        fontStyle: store.fontStyle,
        textDecoration: store.textDecoration,
        timestamp: Date.now(),
      };
      addShape(newShape);
    }
    setTextEditorPosition(null);
  }, [textEditorPosition, addShape, editingTextId]);
  
  // Emoji handlers
  const handleEmojiClick = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left; // CSS pixels
    const screenY = e.clientY - rect.top;  // CSS pixels
    
    const worldPos = screenToWorld(screenX, screenY, {
      ...viewport,
      width,
      height,
    });
    
    // Show emoji picker at click position (screen space)
    setEmojiPickerPosition({ x: e.clientX, y: e.clientY });
    setPendingEmojiPosition(worldPos);
  }, [viewport, width, height]);
  
  const handleEmojiSelect = useCallback((emoji: string) => {
    if (pendingEmojiPosition) {
      const store = useWhiteboardStore.getState();
      const newShape = {
        id: `emoji-${Date.now()}`,
        type: 'stamp' as const,
        color: store.color,
        size: store.fontSize,
        opacity: 1,
        lineStyle: 'solid' as const,
        points: [pendingEmojiPosition],
        stampEmoji: emoji,
        fontSize: store.fontSize,
        timestamp: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      addShape(newShape);
    }
    
    setEmojiPickerPosition(null);
    setPendingEmojiPosition(null);
  }, [pendingEmojiPosition, addShape]);
  
  // Tool activation/deactivation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (tool === 'text') {
      activateTextTool();
      return () => {
        deactivateTextTool();
      };
    } else if (tool === 'highlighter') {
      activateHighlighterTool();
      return () => deactivateHighlighterTool();
    } else if (tool === 'eraser') {
      activateEraserTool();
      return () => deactivateEraserTool();
    } else if (tool === 'rectangle') {
      activateRectangleTool(canvas || undefined);
      return () => deactivateRectangleTool();
    } else if (tool === 'line') {
      activateLineTool(canvas || undefined);
      return () => deactivateLineTool();
    } else if (tool === 'arrow') {
      activateArrowTool(canvas || undefined);
      return () => deactivateArrowTool();
    }
    return undefined;
  }, [tool]);
  
  // Keyboard shortcuts
  const undo = useWhiteboardStore((s: any) => s.undo);
  const redo = useWhiteboardStore((s: any) => s.redo);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const target = (e.target as HTMLElement) || active;
      const isEditable = !!(
        target && (
          target.closest('.wb-text-editor') ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable
        )
      );
      if (isEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  // Combined pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Viewport width/height must be CSS pixels
    const viewportState = {
      ...viewport,
      width,
      height,
    };

    if (tool === 'text') {
      handleTextClick(e);
      return;
    } else if (tool === 'highlighter') {
      handleHighlighterPointerDown(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'eraser') {
      handleEraserPointerDown(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'rectangle') {
      handleRectanglePointerDown(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'line') {
      handleLinePointerDown(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'arrow') {
      handleArrowPointerDown(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'stamp') {
      handleEmojiClick(e);
    } else if (tool === 'hand') {
      handlePanStart(e);
    } else {
      handlePointerDown(e.nativeEvent);
    }
  }, [tool, viewport, width, height, handleTextClick, handleEmojiClick, handlePanStart, handlePointerDown]);
  
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const viewportState = {
      ...viewport,
      width,
      height,
    };

    if (tool === 'text') {
      handleTextPointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'highlighter') {
      handleHighlighterPointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'eraser') {
      handleEraserPointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'rectangle') {
      handleRectanglePointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'line') {
      handleLinePointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'arrow') {
      handleArrowPointerMove(e.nativeEvent, canvas, viewportState);
    } else if (tool === 'hand') {
      handlePanMove(e);
    } else {
      handlePointerMove(e.nativeEvent);
    }
  }, [tool, viewport, width, height, handlePanMove, handlePointerMove]);
  
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tool === 'text') {
      handleTextPointerUp(e.nativeEvent);
    } else if (tool === 'highlighter') {
      handleHighlighterPointerUp(e.nativeEvent, canvas);
    } else if (tool === 'eraser') {
      handleEraserPointerUp(e.nativeEvent, canvas);
    } else if (tool === 'rectangle') {
      handleRectanglePointerUp(e.nativeEvent, canvas);
    } else if (tool === 'line') {
      handleLinePointerUp(e.nativeEvent, canvas);
    } else if (tool === 'arrow') {
      handleArrowPointerUp(e.nativeEvent, canvas);
    } else if (tool === 'hand') {
      handlePanEnd(e);
    } else {
      handlePointerUp(e.nativeEvent);
    }
  }, [tool, handlePanEnd, handlePointerUp]);
  
  // Set canvas size with devicePixelRatio for crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    // Internal drawing buffer size (device pixels)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Visual size in CSS pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, [width, height]);
  
  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{
          cursor:
            tool === 'hand'
              ? 'grab'
              : tool === 'select'
              ? 'default'
              : tool === 'text'
              ? 'text'
              : tool === 'eraser'
              ? 'cell'
              : 'crosshair',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (tool === 'text') {
            handleTextClick(e);
          }
        }}
        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (tool !== 'text') return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const sx = e.clientX - rect.left; // CSS px
          const sy = e.clientY - rect.top;  // CSS px
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Viewport uses CSS width/height
          const viewportState = { ...viewport, width, height };

          const worldPos = screenToWorld(sx, sy, viewportState);
          setTextEditorPosition(worldPos);
          setEditingTextId(null);

          const shapesArr = Array.from(useWhiteboardStore.getState().shapes.values());
          for (let i = shapesArr.length - 1; i >= 0; i--) {
            const s = shapesArr[i] as import('../types').WhiteboardShape;
            if (s.type !== 'text' || !s.text || !s.points || s.points.length === 0) continue;
            const origin = s.points[0];
            const sp = worldToScreen(origin, viewportState);
            const style = {
              fontFamily: s.fontFamily || 'Inter, system-ui, sans-serif',
              fontSize: s.fontSize || 16,
              fontWeight: s.fontWeight || 400,
              fontStyle: (s.fontStyle === 'italic' ? 'italic' : 'normal') as 'normal' | 'italic',
              textDecoration: (s.textDecoration === 'underline' ? 'underline' : 'none') as 'none' | 'underline',
            };
            const metrics = measureText(ctx, s.text, style, s.width);
            const pad = 8; // pixels padding for easier hit
            const left = sp.x - pad;
            const top = sp.y - pad;
            const right = sp.x + metrics.totalWidth + pad;
            const bottom = sp.y + metrics.totalHeight + pad;
            if (sx >= left && sx <= right && sy >= top && sy <= bottom) {
              setEditingTextId(s.id);
              setTextEditorPosition(origin);
              return;
            }
          }
        }}
        onWheel={handleWheel}
        data-testid="whiteboard-canvas"
      />
      
      {/* Text Editor */}
      {textEditorPosition && (
        <TextEditor
          position={textEditorPosition}
          onComplete={handleTextComplete}
          onCancel={() => { setTextEditorPosition(null); setEditingTextId(null); }}
          initialText={editingTextId ? (useWhiteboardStore.getState().shapes.get(editingTextId)?.text ?? '') : ''}
          nodeId={editingTextId || undefined}
          onUpdate={editingTextId ? (t) => useWhiteboardStore.getState().updateShape(editingTextId, { text: t }) : undefined}
          viewportWidth={width}
          viewportHeight={height}
        />
      )}
      
      {/* Emoji Picker */}
      {emojiPickerPosition && (
        <EmojiPicker
          position={emojiPickerPosition}
          onSelect={handleEmojiSelect}
          onClose={() => {
            setEmojiPickerPosition(null);
            setPendingEmojiPosition(null);
          }}
        />
      )}
    </>
  );
}
