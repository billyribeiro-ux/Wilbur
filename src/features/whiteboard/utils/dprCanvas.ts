/**
 * DPR Canvas Utilities
 * Microsoft L68+ Principal Engineer Standards
 * DPR (Device Pixel Ratio) as Single Source of Truth
 */

/**
 * Setup canvas with proper DPR scaling
 * DPR as SSOT - ensures crisp rendering on all devices
 */
export function setupCanvasDPR(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // DPR as SSOT (Single Source of Truth) - Microsoft L68+ Standard
  const dpr = window.devicePixelRatio || 1;
  
  // Set CSS size (visual size)
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual canvas size (internal resolution)
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // Scale the drawing context so everything draws at correct size
  ctx.scale(dpr, dpr);
  
  return ctx;
}

/**
 * Convert screen coordinates to canvas coordinates respecting DPR
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  
  // Convert to canvas-relative coordinates (CSS pixels)
  const x = screenX - rect.left;
  const y = screenY - rect.top;
  
  return { x, y };
}

/**
 * Convert normalized coordinates (0-1) to canvas coordinates
 */
export function normalizedToCanvas(
  normalizedX: number,
  normalizedY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  
  return {
    x: normalizedX * rect.width,
    y: normalizedY * rect.height
  };
}

/**
 * Convert canvas coordinates to normalized coordinates (0-1)
 */
export function canvasToNormalized(
  canvasX: number,
  canvasY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  
  return {
    x: canvasX / rect.width,
    y: canvasY / rect.height
  };
}

/**
 * Get current DPR value
 */
export function getDPR(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Scale a value by DPR for internal canvas operations
 */
export function scaleToDPR(value: number): number {
  return value * getDPR();
}

/**
 * Scale a value from DPR back to CSS pixels
 */
export function scaleFromDPR(value: number): number {
  return value / getDPR();
}
