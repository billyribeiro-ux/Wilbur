// ============================================================================
// PERFORMANCE UTILITIES - RAF Batching & Viewport Caching
// ============================================================================
// Eliminates getBoundingClientRect() spam and batches pointer updates
// ============================================================================

import type { ViewportTransform, WhiteboardPoint } from '../types';

// =============================================================================
// VIEWPORT CACHE - Eliminates getBoundingClientRect() spam
// =============================================================================

interface CachedViewport {
  rect: DOMRect;
  viewportState: ViewportTransform;
  timestamp: number;
}

class ViewportCache {
  private cache = new WeakMap<HTMLElement, CachedViewport>();
  private readonly CACHE_DURATION_MS = 16; // ~1 frame @ 60fps

  /**
   * Get cached viewport data or compute fresh if stale
   * Returns both rect (for pointer calculations) and viewportState
   */
  get(
    element: HTMLElement,
    viewport: ViewportTransform
  ): { rect: DOMRect; viewportState: ViewportTransform } {
    const cached = this.cache.get(element);
    const now = performance.now();

    // Return cached if fresh (< 16ms old)
    if (cached && now - cached.timestamp < this.CACHE_DURATION_MS) {
      return {
        rect: cached.rect,
        viewportState: cached.viewportState,
      };
    }

    // Compute fresh
    const rect = element.getBoundingClientRect();
    const viewportState: ViewportTransform = {
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
      width: rect.width,
      height: rect.height,
    };

    this.cache.set(element, {
      rect,
      viewportState,
      timestamp: now,
    });

    return { rect, viewportState };
  }

  /**
   * Invalidate cache for element (call on resize)
   */
  invalidate(element: HTMLElement): void {
    this.cache.delete(element);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache = new WeakMap();
  }
}

// =============================================================================
// POINTER BATCHER - RAF-based update batching
// =============================================================================

class PointerBatcher {
  private rafId: number | null = null;
  private pendingCallback: (() => void) | null = null;

  /**
   * Schedule a callback to run on next RAF
   * If already scheduled, replaces the pending callback (batching behavior)
   */
  scheduleUpdate(callback: () => void): void {
    this.pendingCallback = callback;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingCallback) {
          this.pendingCallback();
        }
        this.rafId = null;
        this.pendingCallback = null;
      });
    }
  }

  /**
   * Cancel pending RAF callback and execute immediately if one exists
   */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Execute immediately to ensure final state is committed
    if (this.pendingCallback) {
      this.pendingCallback();
      this.pendingCallback = null;
    }
  }
}

// =============================================================================
// POINT SIMPLIFICATION - Reduces point count while preserving shape
// =============================================================================

/**
 * Distance-based point filtering
 * Removes points that are closer than minDistance to the previous kept point
 * Fast O(n) algorithm for real-time drawing
 */
export function simplifyPointsByDistance(
  points: WhiteboardPoint[],
  minDistance: number
): WhiteboardPoint[] {
  if (points.length <= 2) return points;

  const result: WhiteboardPoint[] = [points[0]];
  let lastPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const dx = point.x - lastPoint.x;
    const dy = point.y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= minDistance) {
      result.push(point);
      lastPoint = point;
    }
  }

  // Always include last point
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }

  return result;
}

/**
 * Douglas-Peucker algorithm
 * Reduces point count by 80-95% while preserving visual fidelity
 * Higher epsilon = more aggressive simplification
 */
export function simplifyPoints(
  points: WhiteboardPoint[],
  epsilon: number
): WhiteboardPoint[] {
  if (points.length <= 2) return points;

  // Find point with maximum distance from line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPoints(points.slice(maxIndex), epsilon);

    // Combine results (remove duplicate point at junction)
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, just keep the endpoints
  return [points[0], points[end]];
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(
  point: WhiteboardPoint,
  lineStart: WhiteboardPoint,
  lineEnd: WhiteboardPoint
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // Handle degenerate case (line is a point)
  if (dx === 0 && dy === 0) {
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  // Calculate perpendicular distance using cross product
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(dx * dx + dy * dy);

  return numerator / denominator;
}

// =============================================================================
// EXPORTS - Singleton instances
// =============================================================================

export const viewportCache = new ViewportCache();
export const pointerBatcher = new PointerBatcher();
