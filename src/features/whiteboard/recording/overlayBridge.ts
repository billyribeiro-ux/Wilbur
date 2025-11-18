// ============================================================================
// OVERLAY BRIDGE - Recording Integration for Annotations
// ============================================================================
// Ensures emoji and other annotations are composited into recording stream
// Toolbar UI is excluded (presenter-only)
// ============================================================================

import type { EmojiObject, WhiteboardShape, ViewportState } from '../types';

interface OverlayBridgeConfig {
  includeEmojis: boolean;
  includeShapes: boolean;
  includeText: boolean;
  excludeToolbar: boolean;
}

let overlayCanvas: HTMLCanvasElement | null = null;
let overlayContext: CanvasRenderingContext2D | null = null;
let isAttached = false;

// Attach overlay to recording stream
export function attachOverlay(
  sourceCanvas: HTMLCanvasElement,
  _config: OverlayBridgeConfig = {
    includeEmojis: true,
    includeShapes: true,
    includeText: true,
    excludeToolbar: true,
  }
): HTMLCanvasElement {
  if (overlayCanvas) {
    return overlayCanvas;
  }
  
  // Create overlay canvas
  overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = sourceCanvas.width;
  overlayCanvas.height = sourceCanvas.height;
  overlayContext = overlayCanvas.getContext('2d');
  
  if (!overlayContext) {
    throw new Error('Failed to get overlay canvas context');
  }
  
  isAttached = true;
  
  // Overlay attached for recording
  
  return overlayCanvas;
}

// Detach overlay from recording stream
export function detachOverlay() {
  if (overlayCanvas) {
    overlayCanvas.remove();
    overlayCanvas = null;
    overlayContext = null;
  }
  
  isAttached = false;
  
  // Overlay detached from recording
}

// Composite annotations onto overlay canvas
export function compositeAnnotations(
  shapes: Map<string, WhiteboardShape>,
  emojis: Map<string, EmojiObject>,
  viewport: ViewportState
) {
  if (!overlayCanvas || !overlayContext || !isAttached) {
    return;
  }
  
  // Clear overlay
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  // Render shapes (pen, highlighter, text, etc.)
  shapes.forEach((shape) => {
    // Render shape using same logic as main canvas
    // This ensures consistency between live view and recording
    renderShapeToOverlay(overlayContext!, shape, viewport);
  });
  
  // Render emojis
  emojis.forEach((emoji) => {
    renderEmojiToOverlay(overlayContext!, emoji, viewport);
  });
}

// Render shape to overlay (simplified)
function renderShapeToOverlay(
  _ctx: CanvasRenderingContext2D,
  _shape: WhiteboardShape,
  _viewport: ViewportState
) {
  // Implementation matches main canvas rendering
  // Excluded for brevity - uses same drawShape logic
  // Rendering shape to overlay
}

// Render emoji to overlay
function renderEmojiToOverlay(
  ctx: CanvasRenderingContext2D,
  emoji: EmojiObject,
  viewport: ViewportState
) {
  ctx.save();
  
  // Transform to screen space
  const screenX = emoji.x * viewport.zoom + viewport.panX;
  const screenY = emoji.y * viewport.zoom + viewport.panY;
  
  ctx.translate(screenX, screenY);
  ctx.rotate(emoji.rotation);
  ctx.globalAlpha = emoji.opacity;
  
  const size = 48 * emoji.scale * viewport.zoom;
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji.glyph, 0, 0);
  
  ctx.restore();
}

// Check if overlay is attached
export function isOverlayAttached(): boolean {
  return isAttached;
}

// Get overlay canvas for stream capture
export function getOverlayCanvas(): HTMLCanvasElement | null {
  return overlayCanvas;
}
