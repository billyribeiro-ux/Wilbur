// ============================================================================
// TRANSFORM UTILITIES - Pan/Zoom Mathematics
// ============================================================================
// Screen ↔ World coordinate conversions and viewport transforms
// ============================================================================

import type { WhiteboardPoint, ViewportTransform, ViewportState } from '../types';

/**
 * Convert screen coordinates to world coordinates (normalized 0-1)
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportState
): WhiteboardPoint {
  const { panX, panY, zoom, width, height } = viewport;
  
  // screenX/screenY are in CSS pixels; width/height are CSS pixels
  const worldX = (screenX / width - panX) / zoom;
  const worldY = (screenY / height - panY) / zoom;
  
  return { x: worldX, y: worldY };
}

/**
 * Convert world coordinates (normalized 0-1) to screen coordinates
 */
export function worldToScreen(
  point: WhiteboardPoint,
  viewport: ViewportState
): { x: number; y: number } {
  const { panX, panY, zoom, width, height } = viewport;
  
  const screenX = (point.x * zoom + panX) * width;
  const screenY = (point.y * zoom + panY) * height;
  
  return { x: screenX, y: screenY };
}

/**
 * Apply viewport transform to canvas context
 *
 * Assumes:
 * - viewport.width / viewport.height are CSS pixel sizes of the canvas.
 * - The canvas backing store has been sized as:
 *     canvas.width  = viewport.width  * dpr
 *     canvas.height = viewport.height * dpr
 *
 * World coordinates are normalized 0–1.
 * Final mapping to device pixels:
 *   x_dev = zoom * width * dpr * x_world + panX * width * dpr
 *   y_dev = zoom * height * dpr * y_world + panY * height * dpr
 */
export function applyTransform(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState
): void {
  const { panX, panY, zoom, width, height } = viewport;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Set full matrix explicitly: [ a c e ; b d f ]
  ctx.setTransform(
    zoom * width * dpr,   // a
    0,                    // b
    0,                    // c
    zoom * height * dpr,  // d
    panX * width * dpr,   // e
    panY * height * dpr   // f
  );
}

/**
 * Reset canvas transform to identity
 */
export function resetTransform(ctx: CanvasRenderingContext2D): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Get bounding box of a set of points
 */
export function getBounds(points: WhiteboardPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Clamp zoom to min/max bounds
 */
export function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Calculate zoom to fit all shapes in viewport
 */
export function fitToViewport(
  points: WhiteboardPoint[],
  _viewportWidth: number,
  _viewportHeight: number,
  padding = 0.1
): ViewportTransform {
  if (points.length === 0) {
    return { panX: 0, panY: 0, zoom: 1 };
  }
  
  const bounds = getBounds(points);
  
  // Add padding
  const paddedWidth = bounds.width * (1 + padding * 2);
  const paddedHeight = bounds.height * (1 + padding * 2);
  
  // Calculate zoom to fit
  const zoomX = 1 / paddedWidth;
  const zoomY = 1 / paddedHeight;
  const zoom = Math.min(zoomX, zoomY);
  
  // Center the content
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;
  const panX = 0.5 - centerX * zoom;
  const panY = 0.5 - centerY * zoom;
  
  return { panX, panY, zoom };
}

/**
 * Distance between two points
 */
export function distance(p1: WhiteboardPoint, p2: WhiteboardPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Interpolate between two points
 */
export function lerp(p1: WhiteboardPoint, p2: WhiteboardPoint, t: number): WhiteboardPoint {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}
