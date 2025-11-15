NEW FILE: src/features/whiteboard/utils/performance.ts
// ============================================================================
// PERFORMANCE UTILITIES - RAF Batching & Viewport Caching
// ============================================================================
// Eliminates getBoundingClientRect() spam and batches pointer updates
// ============================================================================

import type { ViewportTransform } from '../types';

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
// EXPORTS - Singleton instances
// =============================================================================

export const viewportCache = new ViewportCache();
export const pointerBatcher = new PointerBatcher();