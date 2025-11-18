/**
 * Whiteboard Tools Integration Hook
 * CRITICAL FIX: Integrates ALL tool handlers
 * Microsoft L70+ Principal Engineer
 */

import { useCallback, useRef } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import type { ViewportState } from '../types';

// Import ALL tool handlers
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

interface UseWhiteboardToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewportState: ViewportState;
  canAnnotate: boolean;
}

export function useWhiteboardTools({
  canvasRef,
  viewportState,
  canAnnotate
}: UseWhiteboardToolsProps) {
  const tool = useWhiteboardStore((s) => s.tool);
  const viewport = useWhiteboardStore((s) => s.viewport);
  const setPan = useWhiteboardStore((s) => s.setPan);
  
  // Hand tool state
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  
  // Previous tool for cleanup
  const previousToolRef = useRef<string | null>(null);
  
  /**
   * Activate current tool
   */
  const activateTool = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Deactivate previous tool
    if (previousToolRef.current) {
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
    
    // Activate new tool - CRITICAL: Must activate for handlers to work!
    console.log(`[WhiteboardTools] Activating tool: ${tool}`);
    switch (tool) {
      case 'pen': 
        activatePenTool(canvas);
        console.log('[WhiteboardTools] Pen tool activated');
        break;
      case 'highlighter': 
        activateHighlighterTool(canvas);
        console.log('[WhiteboardTools] Highlighter tool activated');
        break;
      case 'eraser': 
        activateEraserTool(canvas);
        console.log('[WhiteboardTools] Eraser tool activated');
        break;
      case 'line': 
        activateLineTool(canvas);
        console.log('[WhiteboardTools] Line tool activated');
        break;
      case 'rectangle': 
        activateRectangleTool(canvas);
        console.log('[WhiteboardTools] Rectangle tool activated');
        break;
      case 'circle': 
        activateCircleTool(canvas);
        console.log('[WhiteboardTools] Circle tool activated');
        break;
      case 'arrow': 
        activateArrowTool(canvas);
        console.log('[WhiteboardTools] Arrow tool activated');
        break;
      case 'text': 
        activateTextTool(canvas);
        console.log('[WhiteboardTools] Text tool activated');
        break;
      case 'stamp': 
        activateEmojiTool();
        console.log('[WhiteboardTools] Emoji tool activated');
        break;
      case 'hand':
        canvas.style.cursor = 'grab';
        break;
      default:
        canvas.style.cursor = 'default';
    }
    
    previousToolRef.current = tool;
  }, [tool, canvasRef]);
  
  /**
   * Handle pointer down for ALL tools
   */
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canAnnotate && tool !== 'hand') return;
    
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
    
    // Convert React event to native PointerEvent for tool handlers
    const nativeEvent = e.nativeEvent;
    
    // Call appropriate tool handler
    console.log(`[WhiteboardTools] Handling ${tool} pointerDown`);
    let handled = false;
    switch (tool) {
      case 'pen':
        handled = handlePenPointerDown(nativeEvent, canvas, viewportState);
        console.log(`[WhiteboardTools] Pen handled: ${handled}`);
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
    
    if (handled) {
      e.preventDefault();
    }
  }, [tool, canAnnotate, viewport, canvasRef]);
  
  /**
   * Handle pointer move for ALL tools
   */
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Hand tool panning
    if (tool === 'hand' && isPanningRef.current) {
      const dx = (e.clientX - lastPanPointRef.current.x) / viewportState.width;
      const dy = (e.clientY - lastPanPointRef.current.y) / viewportState.height;
      
      setPan(viewport.panX + dx, viewport.panY + dy);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    
    if (!canAnnotate) return;
    
    const nativeEvent = e.nativeEvent;
    
    // Call appropriate tool handler
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
  }, [tool, canAnnotate, viewport, viewportState, setPan, canvasRef]);
  
  /**
   * Handle pointer up for ALL tools
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
    
    // Call appropriate tool handler
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
    
    if (handled) {
      e.preventDefault();
    }
  }, [tool, canAnnotate, canvasRef]);
  
  /**
   * Handle keyboard events for text tool
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!canAnnotate) return;
    
    if (tool === 'text') {
      const handled = handleTextKeyDown(e.nativeEvent as KeyboardEvent);
      if (handled) {
        e.preventDefault();
      }
    }
  }, [tool, canAnnotate]);
  
  return {
    activateTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown
  };
}
