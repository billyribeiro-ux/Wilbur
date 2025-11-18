/**
 * WHITEBOARD CANVAS - FINAL WORKING VERSION
 * ALL TOOLS PROPERLY INTEGRATED
 * Microsoft L70+ Principal Engineer
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { applyTransform, resetTransform } from '../utils/transform';
import { drawShape } from '../utils/drawPrimitives';
import type { ViewportState, WhiteboardShape } from '../types';

// Import ALL tool handlers directly
import { 
  activatePenTool, 
  deactivatePenTool,
  handlePenPointerDown,
  handlePenPointerMove,
  handlePenPointerUp
} from '../tools/PenTool';
import {
  activateHighlighterTool,
  deactivateHighlighterTool,
  handleHighlighterPointerDown,
  handleHighlighterPointerMove,
  handleHighlighterPointerUp
} from '../tools/HighlighterTool';
import {
  activateEraserTool,
  deactivateEraserTool,
  handleEraserPointerDown,
  handleEraserPointerMove,
  handleEraserPointerUp
} from '../tools/EraserTool';
import {
  activateLineTool,
  deactivateLineTool,
  handleLinePointerDown,
  handleLinePointerMove,
  handleLinePointerUp
} from '../tools/LineTool';
import {
  activateRectangleTool,
  deactivateRectangleTool,
  handleRectanglePointerDown,
  handleRectanglePointerMove,
  handleRectanglePointerUp
} from '../tools/RectangleTool';
import {
  activateCircleTool,
  deactivateCircleTool,
  handleCirclePointerDown,
  handleCirclePointerMove,
  handleCirclePointerUp
} from '../tools/CircleTool';
import {
  activateArrowTool,
  deactivateArrowTool,
  handleArrowPointerDown,
  handleArrowPointerMove,
  handleArrowPointerUp
} from '../tools/ArrowTool';
import {
  activateTextTool,
  deactivateTextTool,
  handleTextPointerDown,
  handleTextPointerMove,
  handleTextPointerUp,
  handleTextKeyDown
} from '../tools/TextTool';
import {
  activateEmojiTool,
  deactivateEmojiTool,
  handleEmojiPointerDown,
  handleEmojiPointerMove,
  handleEmojiPointerUp
} from '../tools/EmojiTool';

interface WhiteboardCanvasProps {
  width: number;
  height: number;
  canAnnotate: boolean;
}

export function WhiteboardCanvas({ width, height, canAnnotate }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef<string | null>(null);
  
  // Store state
  const shapes = useWhiteboardStore((s) => s.shapes);
  const viewport = useWhiteboardStore((s) => s.viewport);
  const tool = useWhiteboardStore((s) => s.tool);
  const setZoom = useWhiteboardStore((s) => s.setZoom);
  const setPan = useWhiteboardStore((s) => s.setPan);
  
  // Create viewport state with CSS dimensions
  const viewportState = useMemo<ViewportState>(() => ({
    ...viewport,
    width,
    height
  }), [viewport, width, height]);
  
  /**
   * Setup canvas with proper DPR
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal size (device pixels)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    // Set CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    console.log(`[Canvas] Setup: ${width}x${height} CSS, ${canvas.width}x${canvas.height} device pixels, DPR: ${dpr}`);
  }, [width, height]);
  
  /**
   * Activate/deactivate tools
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Deactivate previous tool
    if (previousToolRef.current) {
      console.log(`[Canvas] Deactivating tool: ${previousToolRef.current}`);
      switch (previousToolRef.current) {
        case 'pen': deactivatePenTool(); break;
        case 'highlighter': deactivateHighlighterTool(); break;
        case 'eraser': deactivateEraserTool(); break;
        case 'line': deactivateLineTool(); break;
        case 'rectangle': deactivateRectangleTool(); break;
        case 'circle': deactivateCircleTool(); break;
        case 'arrow': deactivateArrowTool(); break;
        case 'text': deactivateTextTool(); break;
        case 'stamp': deactivateEmojiTool(); break;
      }
    }
    
    // Activate new tool
    console.log(`[Canvas] Activating tool: ${tool}`);
    switch (tool) {
      case 'pen': activatePenTool(canvas); break;
      case 'highlighter': activateHighlighterTool(canvas); break;
      case 'eraser': activateEraserTool(canvas); break;
      case 'line': activateLineTool(canvas); break;
      case 'rectangle': activateRectangleTool(canvas); break;
      case 'circle': activateCircleTool(canvas); break;
      case 'arrow': activateArrowTool(canvas); break;
      case 'text': activateTextTool(canvas); break;
      case 'stamp': activateEmojiTool(); break;
      case 'hand': canvas.style.cursor = 'grab'; break;
      default: canvas.style.cursor = 'default';
    }
    
    previousToolRef.current = tool;
  }, [tool]);
  
  /**
   * Main render function
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas (device pixels)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Apply viewport transform
    applyTransform(ctx, viewportState);
    
    // Draw all shapes
    shapes.forEach((shape: WhiteboardShape) => {
      drawShape(ctx, shape, viewportState);
    });
    
    // Reset transform
    resetTransform(ctx);
  }, [shapes, viewportState]);
  
  /**
   * Animation loop
   */
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);
  
  /**
   * Handle pointer down
   */
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Hand tool (always available)
    if (tool === 'hand') {
      isPanningRef.current = true;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }
    
    if (!canAnnotate) return;
    
    // Get native event for tool handlers
    const nativeEvent = e.nativeEvent;
    
    // Call appropriate tool handler
    console.log(`[Canvas] PointerDown for tool: ${tool}`);
    let handled = false;
    
    switch (tool) {
      case 'pen':
        handled = handlePenPointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'highlighter':
        handled = handleHighlighterPointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'eraser':
        handled = handleEraserPointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'line':
        handled = handleLinePointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'rectangle':
        handled = handleRectanglePointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'circle':
        handled = handleCirclePointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'arrow':
        handled = handleArrowPointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'text':
        handled = handleTextPointerDown(nativeEvent, canvas, viewportState);
        break;
      case 'stamp':
        handled = handleEmojiPointerDown(nativeEvent, canvas, viewportState);
        break;
    }
    
    console.log(`[Canvas] Tool ${tool} handled: ${handled}`);
    
    if (handled) {
      e.preventDefault();
    }
  }, [tool, canAnnotate, viewport]);
  
  /**
   * Handle pointer move
   */
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Hand tool panning
    if (tool === 'hand' && isPanningRef.current) {
      const dx = (e.clientX - lastPanPointRef.current.x) / width;
      const dy = (e.clientY - lastPanPointRef.current.y) / height;
      
      setPan(viewport.panX + dx, viewport.panY + dy);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    
    if (!canAnnotate) return;
    
    const nativeEvent = e.nativeEvent;
    let handled = false;
    
    switch (tool) {
      case 'pen':
        handled = handlePenPointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'highlighter':
        handled = handleHighlighterPointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'eraser':
        handled = handleEraserPointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'line':
        handled = handleLinePointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'rectangle':
        handled = handleRectanglePointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'circle':
        handled = handleCirclePointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'arrow':
        handled = handleArrowPointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'text':
        handled = handleTextPointerMove(nativeEvent, canvas, viewportState);
        break;
      case 'stamp':
        handled = handleEmojiPointerMove(nativeEvent, canvas, viewportState);
        break;
    }
    
    if (handled) {
      e.preventDefault();
    }
  }, [tool, canAnnotate, viewport, width, height, setPan]);
  
  /**
   * Handle pointer up
   */
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Hand tool
    if (tool === 'hand') {
      isPanningRef.current = false;
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = 'grab';
      e.preventDefault();
      return;
    }
    
    if (!canAnnotate) return;
    
    const nativeEvent = e.nativeEvent;
    let handled = false;
    
    switch (tool) {
      case 'pen':
        handled = handlePenPointerUp(nativeEvent, canvas);
        break;
      case 'highlighter':
        handled = handleHighlighterPointerUp(nativeEvent, canvas);
        break;
      case 'eraser':
        handled = handleEraserPointerUp(nativeEvent, canvas);
        break;
      case 'line':
        handled = handleLinePointerUp(nativeEvent, canvas);
        break;
      case 'rectangle':
        handled = handleRectanglePointerUp(nativeEvent, canvas);
        break;
      case 'circle':
        handled = handleCirclePointerUp(nativeEvent, canvas);
        break;
      case 'arrow':
        handled = handleArrowPointerUp(nativeEvent, canvas);
        break;
      case 'text':
        handled = handleTextPointerUp(nativeEvent, canvas);
        break;
      case 'stamp':
        handled = handleEmojiPointerUp(nativeEvent, canvas);
        break;
    }
    
    console.log(`[Canvas] PointerUp for tool ${tool} handled: ${handled}`);
    
    if (handled) {
      e.preventDefault();
    }
  }, [tool, canAnnotate]);
  
  /**
   * Handle wheel for zoom
   */
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * (1 + delta)));
    
    // Get pointer position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Calculate new pan to keep pointer position stable
    const scale = newZoom / viewport.zoom;
    const newPanX = pos.x / width - (pos.x / width - viewport.panX) * scale;
    const newPanY = pos.y / height - (pos.y / height - viewport.panY) * scale;
    
    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, [viewport, width, height, setZoom, setPan]);
  
  // Handle keyboard for text tool
  useEffect(() => {
    if (tool !== 'text') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const handled = handleTextKeyDown(e);
      if (handled) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tool]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 touch-none"
      style={{
        cursor: tool === 'hand' ? 'grab' :
                tool === 'eraser' ? 'cell' :
                tool === 'text' ? 'text' :
                tool === 'stamp' ? 'copy' :
                'crosshair'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      data-testid="whiteboard-canvas"
    />
  );
}
