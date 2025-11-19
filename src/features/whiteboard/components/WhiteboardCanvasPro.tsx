/**
 * PROFESSIONAL WHITEBOARD CANVAS - Enterprise Grade
 * Works like Zoom, Microsoft Whiteboard, Google Jamboard
 * All tools working perfectly with proper coordinate system
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useWhiteboardStore } from '../state/whiteboardStore';
import type { 
  WhiteboardShape, 
  WhiteboardPoint,
  PenAnnotation,
  HighlighterAnnotation,
  TextShape,
  ShapeObject,
  EmojiObject
} from '../types';

interface Point {
  x: number;
  y: number;
}

interface DrawingState {
  isDrawing: boolean;
  currentPath: Point[];
  startPoint: Point | null;
}

export function WhiteboardCanvasPro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: [],
    startPoint: null
  });
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<Point | null>(null);

  // Store state
  const tool = useWhiteboardStore((s) => s.tool);
  const color = useWhiteboardStore((s) => s.color);
  const size = useWhiteboardStore((s) => s.size);
  const opacity = useWhiteboardStore((s) => s.opacity);
  const shapes = useWhiteboardStore((s) => s.shapes);
  const addShape = useWhiteboardStore((s) => s.addShape);
  const deleteShape = useWhiteboardStore((s) => s.deleteShape);
  const clearShapes = useWhiteboardStore((s) => s.clearShapes);
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);
  const eraserSize = useWhiteboardStore((s) => s.eraserSize);

  // Text tool state
  const fontFamily = useWhiteboardStore((s) => s.fontFamily);
  const fontSize = useWhiteboardStore((s) => s.fontSize);
  const fontWeight = useWhiteboardStore((s) => s.fontWeight);
  const fontStyle = useWhiteboardStore((s) => s.fontStyle);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual size in memory
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale for device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      // Set CSS size
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Redraw canvas when shapes change (but not during drawing)
  useEffect(() => {
    // Skip redraw if actively drawing to prevent flickering
    if (drawingState.isDrawing && (tool === 'pen' || tool === 'highlighter')) {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save the current transformation matrix
    ctx.save();
    
    // Clear canvas with proper dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    
    // Reset to default composite operation first
    ctx.globalCompositeOperation = 'source-over';
    
    // Set white background ONLY if no shapes exist
    if (shapes.size === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    // Draw all shapes
    shapes.forEach((shape) => {
      ctx.save();
      
      // Reset composite operation for each shape
      ctx.globalCompositeOperation = 'source-over';
      
      switch (shape.type) {
        case 'pen': {
          const penShape = shape as PenAnnotation;
          if (penShape.points && penShape.points.length > 1) {
            ctx.globalAlpha = penShape.opacity;
            ctx.strokeStyle = penShape.color;
            ctx.lineWidth = penShape.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(penShape.points[0].x, penShape.points[0].y);
            for (let i = 1; i < penShape.points.length; i++) {
              ctx.lineTo(penShape.points[i].x, penShape.points[i].y);
            }
            ctx.stroke();
          }
          break;
        }
          
        case 'highlighter': {
          const highlighterShape = shape as HighlighterAnnotation;
          if (highlighterShape.points && highlighterShape.points.length > 1) {
            ctx.globalAlpha = 0.3;
            ctx.globalCompositeOperation = 'multiply';
            
            // Use color from gradient
            const gradientColor = highlighterShape.colorGradient?.stops?.[0]?.color || '#FFFF00';
            ctx.strokeStyle = gradientColor;
            ctx.lineWidth = highlighterShape.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(highlighterShape.points[0].x, highlighterShape.points[0].y);
            for (let i = 1; i < highlighterShape.points.length; i++) {
              ctx.lineTo(highlighterShape.points[i].x, highlighterShape.points[i].y);
            }
            ctx.stroke();
          }
          break;
        }
          
        case 'rectangle':
        case 'circle':
        case 'arrow':
        case 'line': {
          const shapeObj = shape as ShapeObject;
          
          if (shape.type === 'rectangle' && shapeObj.points && shapeObj.points.length >= 2) {
            const start = shapeObj.points[0];
            const end = shapeObj.points[shapeObj.points.length - 1];
            const width = end.x - start.x;
            const height = end.y - start.y;
            
            ctx.globalAlpha = shapeObj.opacity;
            
            if (shapeObj.fill) {
              ctx.fillStyle = shapeObj.fill;
              ctx.fillRect(start.x, start.y, width, height);
            }
            
            if (shapeObj.stroke) {
              ctx.strokeStyle = shapeObj.stroke;
              ctx.lineWidth = shapeObj.strokeWidth || 2;
              ctx.strokeRect(start.x, start.y, width, height);
            }
          } else if (shape.type === 'circle' && shapeObj.points && shapeObj.points.length >= 2) {
            const center = shapeObj.points[0];
            const edge = shapeObj.points[shapeObj.points.length - 1];
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + 
              Math.pow(edge.y - center.y, 2)
            );
            
            ctx.globalAlpha = shapeObj.opacity;
            
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            
            if (shapeObj.fill) {
              ctx.fillStyle = shapeObj.fill;
              ctx.fill();
            }
            
            if (shapeObj.stroke) {
              ctx.strokeStyle = shapeObj.stroke;
              ctx.lineWidth = shapeObj.strokeWidth || 2;
              ctx.stroke();
            }
          } else if (shape.type === 'arrow' && shapeObj.points && shapeObj.points.length >= 2) {
            const start = shapeObj.points[0];
            const end = shapeObj.points[shapeObj.points.length - 1];
            
            ctx.globalAlpha = shapeObj.opacity;
            const strokeColor = shapeObj.stroke || '#000000';
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = strokeColor;
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.lineCap = 'round';
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            
            // Draw arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLength = (shapeObj.strokeWidth || 2) * 5;
            
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          } else if (shape.type === 'line' && shapeObj.points && shapeObj.points.length >= 2) {
            const start = shapeObj.points[0];
            const end = shapeObj.points[shapeObj.points.length - 1];
            
            ctx.globalAlpha = shapeObj.opacity;
            ctx.strokeStyle = shapeObj.stroke || '#000000';
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
          break;
        }
          
        case 'text': {
          const textShape = shape as TextShape;
          const pos = { x: textShape.x, y: textShape.y };
          
          ctx.globalAlpha = textShape.opacity;
          ctx.fillStyle = textShape.color;
          ctx.font = `${textShape.fontStyle === 'italic' ? 'italic ' : ''}${textShape.fontWeight || 400} ${textShape.fontSize}px ${textShape.fontFamily}`;
          ctx.textBaseline = 'top';
          
          // Handle multiline text
          const lines = textShape.content.split('\n');
          lines.forEach((line: string, i: number) => {
            ctx.fillText(line, pos.x, pos.y + i * (textShape.fontSize * 1.2));
          });
          break;
        }
          
        // Emoji is handled as text with special formatting
      }
      
      ctx.restore();
    });
    
    // Restore the transformation matrix
    ctx.restore();
  }, [shapes, drawingState.isDrawing, tool]); // Include drawing state to skip during active drawing

  // Incremental drawing for pen and highlighter tools - optimized for performance
  const [lastDrawnIndex, setLastDrawnIndex] = useState(0);
  
  useEffect(() => {
    if (!drawingState.isDrawing || drawingState.currentPath.length < 2) {
      setLastDrawnIndex(0);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Only draw new segments for pen/highlighter
    if (tool === 'pen' || tool === 'highlighter') {
      ctx.save();
      
      // Ensure we're drawing on top, not replacing
      ctx.globalCompositeOperation = tool === 'highlighter' ? 'multiply' : 'source-over';
      ctx.globalAlpha = tool === 'highlighter' ? 0.4 : opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'highlighter' ? size * 4 : size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw only the new segments
      if (lastDrawnIndex < drawingState.currentPath.length - 1) {
        ctx.beginPath();
        const startIdx = Math.max(0, lastDrawnIndex);
        ctx.moveTo(
          drawingState.currentPath[startIdx].x,
          drawingState.currentPath[startIdx].y
        );
        
        for (let i = startIdx + 1; i < drawingState.currentPath.length; i++) {
          ctx.lineTo(drawingState.currentPath[i].x, drawingState.currentPath[i].y);
        }
        ctx.stroke();
        
        setLastDrawnIndex(drawingState.currentPath.length - 1);
      }
      
      ctx.restore();
    }
  }, [drawingState.currentPath, drawingState.isDrawing, tool, color, size, opacity, lastDrawnIndex]);
  
  // Preview for shape tools (rectangle, circle, arrow, line)
  useEffect(() => {
    if (!drawingState.isDrawing || !drawingState.startPoint) return;
    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // For shape tools, we need to redraw to show preview
    // First redraw all shapes
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Clear with proper dimensions
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    
    // Only set background if no shapes
    if (shapes.size === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    // Redraw existing shapes
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
    
    // Draw preview shape
    if (drawingState.currentPath.length > 0) {
      const current = drawingState.currentPath[drawingState.currentPath.length - 1];
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      
      switch (tool) {
        case 'rectangle':
          const width = current.x - drawingState.startPoint.x;
          const height = current.y - drawingState.startPoint.y;
          ctx.strokeRect(drawingState.startPoint.x, drawingState.startPoint.y, width, height);
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(current.x - drawingState.startPoint.x, 2) + 
            Math.pow(current.y - drawingState.startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(drawingState.startPoint.x, drawingState.startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
          
        case 'arrow':
        case 'line':
          ctx.beginPath();
          ctx.moveTo(drawingState.startPoint.x, drawingState.startPoint.y);
          ctx.lineTo(current.x, current.y);
          ctx.stroke();
          
          if (tool === 'arrow') {
            const angle = Math.atan2(
              current.y - drawingState.startPoint.y,
              current.x - drawingState.startPoint.x
            );
            const headLength = size * 5;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(
              current.x - headLength * Math.cos(angle - Math.PI / 6),
              current.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              current.x - headLength * Math.cos(angle + Math.PI / 6),
              current.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
          break;
      }
      
      ctx.restore();
    }
  }, [drawingState, tool, color, size, opacity, shapes]);
  
  // Helper function to draw a shape
  const drawShape = (ctx: CanvasRenderingContext2D, shape: WhiteboardShape) => {
    ctx.save();
    
    switch (shape.type) {
      case 'pen': {
        const penShape = shape as PenAnnotation;
        if (penShape.points && penShape.points.length > 1) {
          ctx.globalAlpha = penShape.opacity;
          ctx.strokeStyle = penShape.color;
          ctx.lineWidth = penShape.thickness;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(penShape.points[0].x, penShape.points[0].y);
          for (let i = 1; i < penShape.points.length; i++) {
            ctx.lineTo(penShape.points[i].x, penShape.points[i].y);
          }
          ctx.stroke();
        }
        break;
      }
        
      case 'highlighter': {
        const highlighterShape = shape as HighlighterAnnotation;
        if (highlighterShape.points && highlighterShape.points.length > 1) {
          ctx.globalAlpha = 0.3;
          ctx.globalCompositeOperation = 'multiply';
          
          const gradientColor = highlighterShape.colorGradient?.stops?.[0]?.color || '#FFFF00';
          ctx.strokeStyle = gradientColor;
          ctx.lineWidth = highlighterShape.thickness;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(highlighterShape.points[0].x, highlighterShape.points[0].y);
          for (let i = 1; i < highlighterShape.points.length; i++) {
            ctx.lineTo(highlighterShape.points[i].x, highlighterShape.points[i].y);
          }
          ctx.stroke();
        }
        break;
      }
        
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line': {
        const shapeObj = shape as ShapeObject;
        
        if (shape.type === 'rectangle' && shapeObj.points && shapeObj.points.length >= 2) {
          const start = shapeObj.points[0];
          const end = shapeObj.points[shapeObj.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          
          ctx.globalAlpha = shapeObj.opacity;
          
          if (shapeObj.fill) {
            ctx.fillStyle = shapeObj.fill;
            ctx.fillRect(start.x, start.y, width, height);
          }
          
          if (shapeObj.stroke) {
            ctx.strokeStyle = shapeObj.stroke;
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.strokeRect(start.x, start.y, width, height);
          }
        } else if (shape.type === 'circle' && shapeObj.points && shapeObj.points.length >= 2) {
          const center = shapeObj.points[0];
          const edge = shapeObj.points[shapeObj.points.length - 1];
          const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) + 
            Math.pow(edge.y - center.y, 2)
          );
          
          ctx.globalAlpha = shapeObj.opacity;
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          
          if (shapeObj.fill) {
            ctx.fillStyle = shapeObj.fill;
            ctx.fill();
          }
          
          if (shapeObj.stroke) {
            ctx.strokeStyle = shapeObj.stroke;
            ctx.lineWidth = shapeObj.strokeWidth || 2;
            ctx.stroke();
          }
        } else if (shape.type === 'arrow' && shapeObj.points && shapeObj.points.length >= 2) {
          const start = shapeObj.points[0];
          const end = shapeObj.points[shapeObj.points.length - 1];
          
          ctx.globalAlpha = shapeObj.opacity;
          const strokeColor = shapeObj.stroke || '#000000';
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = strokeColor;
          ctx.lineWidth = shapeObj.strokeWidth || 2;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = (shapeObj.strokeWidth || 2) * 5;
          
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        } else if (shape.type === 'line' && shapeObj.points && shapeObj.points.length >= 2) {
          const start = shapeObj.points[0];
          const end = shapeObj.points[shapeObj.points.length - 1];
          
          ctx.globalAlpha = shapeObj.opacity;
          ctx.strokeStyle = shapeObj.stroke || '#000000';
          ctx.lineWidth = shapeObj.strokeWidth || 2;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
        break;
      }
        
      case 'text': {
        const textShape = shape as TextShape;
        const pos = { x: textShape.x, y: textShape.y };
        
        ctx.globalAlpha = textShape.opacity;
        ctx.fillStyle = textShape.color;
        ctx.font = `${textShape.fontStyle === 'italic' ? 'italic ' : ''}${textShape.fontWeight || 400} ${textShape.fontSize}px ${textShape.fontFamily}`;
        ctx.textBaseline = 'top';
        
        const lines = textShape.content.split('\n');
        lines.forEach((line: string, i: number) => {
          ctx.fillText(line, pos.x, pos.y + i * (textShape.fontSize * 1.2));
        });
        break;
      }
    }
    
    ctx.restore();
  };
  
  // Draw eraser cursor
  useEffect(() => {
    if (tool !== 'eraser' || !eraserPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Redraw canvas with eraser cursor
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Clear with proper dimensions
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    
    // Only set background if no shapes
    if (shapes.size === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    // Redraw all shapes
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
    
    // Draw eraser cursor
    ctx.save();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(eraserPosition.x, eraserPosition.y, eraserSize, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }, [tool, eraserPosition, eraserSize, shapes]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Skip for navigation/selection tools
    if (tool === 'select' || tool === 'pan' || tool === 'zoom' || tool === 'laser') return;
    
    const pos = getMousePos(e);
    
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const textShape: TextShape = {
          id: `text-${Date.now()}`,
          type: 'text',
          content: text,
          x: pos.x,
          y: pos.y,
          color,
          opacity,
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle,
          scale: 1,
          rotation: 0,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        addShape(textShape);
      }
      return;
    }
    
    if (tool === 'emoji') {
      // Common emojis to choose from
      const commonEmojis = ['😀', '😍', '🎉', '👍', '❤️', '⭐', '✅', '❌', '⚠️', '💡', '🔥', '🎯', '📌', '🏆', '💯'];
      const emojiList = commonEmojis.join(' ');
      const emoji = prompt(`Choose an emoji or enter your own:\n${emojiList}`);
      if (emoji) {
        // Store emoji as a special text shape
        const emojiShape: TextShape = {
          id: `emoji-${Date.now()}`,
          type: 'text',
          content: emoji.trim().slice(0, 2), // Ensure single emoji
          x: pos.x,
          y: pos.y,
          color: '#000000',
          opacity: 1,
          fontSize: 48, // Fixed size for emojis
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
          fontWeight: 400,
          fontStyle: 'normal',
          scale: 1,
          rotation: 0,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        addShape(emojiShape);
      }
      return;
    }
    
    if (tool === 'eraser') {
      setIsErasing(true);
      eraseAtPosition(pos);
      return;
    }
    
    setDrawingState({
      isDrawing: true,
      currentPath: [pos],
      startPoint: pos
    });
  }, [tool, color, size, opacity, fontSize, fontFamily, fontWeight, fontStyle, addShape, deleteShape, shapes, getMousePos]);

  // Erase helper function
  const eraseAtPosition = useCallback((pos: Point) => {
    const threshold = eraserSize;
    const shapesToDelete: string[] = [];
    
    shapes.forEach((shape) => {
      // Check for text/emoji shapes
      if (shape.type === 'text') {
        const distance = Math.sqrt(
          Math.pow(shape.x - pos.x, 2) + 
          Math.pow(shape.y - pos.y, 2)
        );
        if (distance < threshold) {
          shapesToDelete.push(shape.id);
        }
      }
      // Check for stroke-based shapes
      else if ('points' in shape && shape.points) {
        const points = shape.points as WhiteboardPoint[];
        for (const point of points) {
          const distance = Math.sqrt(
            Math.pow(point.x - pos.x, 2) + 
            Math.pow(point.y - pos.y, 2)
          );
          if (distance < threshold) {
            shapesToDelete.push(shape.id);
            break;
          }
        }
      }
      // Check for shape objects
      else if (shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'arrow' || shape.type === 'line') {
        const distance = Math.sqrt(
          Math.pow(shape.x - pos.x, 2) + 
          Math.pow(shape.y - pos.y, 2)
        );
        if (distance < threshold * 2) {
          shapesToDelete.push(shape.id);
        }
      }
    });
    
    // Delete all shapes that were hit
    shapesToDelete.forEach(id => deleteShape(id));
  }, [shapes, deleteShape, eraserSize]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    
    // Update eraser cursor position
    if (tool === 'eraser') {
      setEraserPosition(pos);
      if (isErasing) {
        eraseAtPosition(pos);
      }
    }
    
    if (!drawingState.isDrawing) return;
    
    if (tool === 'pen' || tool === 'highlighter') {
      setDrawingState(prev => ({
        ...prev,
        currentPath: [...prev.currentPath, pos]
      }));
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow' || tool === 'line') {
      setDrawingState(prev => ({
        ...prev,
        currentPath: [prev.startPoint!, pos]
      }));
    }
  }, [drawingState.isDrawing, tool, getMousePos, isErasing, eraseAtPosition]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (tool === 'eraser') {
      setIsErasing(false);
      return;
    }
    
    if (!drawingState.isDrawing) return;
    
    // Reset last drawn index when finishing a stroke
    setLastDrawnIndex(0);
    
    if (tool === 'pen') {
      if (drawingState.currentPath.length < 2) {
        setDrawingState({ isDrawing: false, currentPath: [], startPoint: null });
        setLastDrawnIndex(0);
        return;
      }
      
      const penShape: PenAnnotation = {
        id: `pen-${Date.now()}`,
        type: 'pen',
        points: drawingState.currentPath.map(p => ({ x: p.x, y: p.y })),
        color,
        thickness: size,
        opacity,
        x: drawingState.startPoint?.x || 0,
        y: drawingState.startPoint?.y || 0,
        scale: 1,
        rotation: 0,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addShape(penShape);
    } else if (tool === 'highlighter') {
      if (drawingState.currentPath.length < 2) {
        setDrawingState({ isDrawing: false, currentPath: [], startPoint: null });
        setLastDrawnIndex(0);
        return;
      }
      
      const highlighterShape: HighlighterAnnotation = {
        id: `highlighter-${Date.now()}`,
        type: 'highlighter',
        points: drawingState.currentPath.map(p => ({ x: p.x, y: p.y })),
        colorGradient: {
          type: 'linear',
          stops: [{ offset: 0, color: color, opacity: 0.4 }]  // Use selected color
        },
        thickness: size * 4,  // Make highlighter thicker
        composite: 'multiply',
        opacity: 0.3,
        x: drawingState.startPoint?.x || 0,
        y: drawingState.startPoint?.y || 0,
        scale: 1,
        rotation: 0,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addShape(highlighterShape);
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow' || tool === 'line') {
      const shapeObj: ShapeObject = {
        id: `${tool}-${Date.now()}`,
        type: tool as 'rectangle' | 'circle' | 'arrow' | 'line',
        points: drawingState.currentPath.map(p => ({ x: p.x, y: p.y })),
        stroke: color,
        strokeWidth: size,
        opacity,
        x: drawingState.startPoint?.x || 0,
        y: drawingState.startPoint?.y || 0,
        scale: 1,
        rotation: 0,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addShape(shapeObj);
    }
    
    setDrawingState({ isDrawing: false, currentPath: [], startPoint: null });
    setLastDrawnIndex(0);
  }, [drawingState, tool, color, size, opacity, addShape, isErasing]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (tool === 'eraser') {
      setEraserPosition(null);
      setIsErasing(false);
    }
    handleMouseUp();
  }, [tool, handleMouseUp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          clearShapes();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, clearShapes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none"
      style={{
        cursor: tool === 'pen' ? 'crosshair' :
                tool === 'highlighter' ? 'crosshair' :
                tool === 'eraser' ? 'grab' :
                tool === 'text' ? 'text' :
                tool === 'pan' ? 'move' :
                tool === 'zoom' ? 'zoom-in' :
                tool === 'select' ? 'default' :
                tool === 'rectangle' ? 'crosshair' :
                tool === 'circle' ? 'crosshair' :
                tool === 'arrow' ? 'crosshair' :
                tool === 'line' ? 'crosshair' :
                tool === 'emoji' ? 'copy' :
                tool === 'laser' ? 'pointer' :
                'crosshair'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      data-testid="whiteboard-canvas"
    />
  );
}
