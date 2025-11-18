// ============================================================================
// PEN TOOL - Freehand Drawing (World-space, L65 best practice)
// ============================================================================
// Stores WORLD coordinates; WhiteboardCanvas applies DPR + viewport to ctx.
// Pointer math uses canvas-relative logical CSS px via getPointerInCanvas.
// ============================================================================

import { useWhiteboardStore } from './state/whiteboardStore';
import { screenToWorld } from './utils/transform';
import { getPointerInCanvas } from './utils/pointer';
import type { ViewportTransform, WhiteboardPoint, WhiteboardAnnotation } from './types';

const __BROWSER__ = typeof window !== 'undefined' && typeof document !== 'undefined';

interface PenToolState {
  isActive: boolean;
  isDrawing: boolean;
  currentShapeId: string | null;
  canvasElement: HTMLCanvasElement | null;
  pointerId: number | null;
}

const toolState: PenToolState = {
  isActive: false,
  isDrawing: false,
  currentShapeId: null,
  canvasElement: null,
  pointerId: null,
};

// Stable ID generator
function makeId(prefix = 'pen'): string {
  if (__BROWSER__ && 'crypto' in window && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/** Activate the pen tool */
export function activatePenTool(canvasElement?: HTMLCanvasElement): void {
  toolState.isActive = true;
  if (canvasElement) {
    toolState.canvasElement = canvasElement;
    // Friendly pen-like cursor; fallback to crosshair if data-URI not allowed
    try {
      canvasElement.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="%23000" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>') 2 18, crosshair`;
    } catch {
      canvasElement.style.cursor = 'crosshair';
    }
  }
}

/** Deactivate the pen tool */
export function deactivatePenTool(): void {
  toolState.isActive = false;
  toolState.isDrawing = false;
  toolState.currentShapeId = null;
  toolState.pointerId = null;

  if (toolState.canvasElement) {
    try { toolState.canvasElement.style.cursor = ''; } catch {}
    toolState.canvasElement = null;
  }
}

/** Pointer down — start stroke */
export function handlePenPointerDown(
  e: PointerEvent,
  canvasElement: HTMLElement,
  viewport: ViewportTransform
): boolean {
  if (!toolState.isActive) return false;
  if (e.button !== 0) return false; // left button only

  const store = useWhiteboardStore.getState();
  const { color, size, opacity } = store;

  toolState.isDrawing = true;

  // Pointer capture (best-effort)
  try {
    canvasElement.setPointerCapture(e.pointerId);
    toolState.pointerId = e.pointerId;
  } catch {
    // non-fatal
  }

  // CSS px → world
  const { x, y } = getPointerInCanvas(e, canvasElement);
  // Convert ViewportTransform to ViewportState (respecting DPR as SSOT)
  const rect = canvasElement.getBoundingClientRect();
  const viewportState = {
    ...viewport,
    width: rect.width,   // CSS pixels
    height: rect.height  // CSS pixels
  };
  const worldPoint = screenToWorld(x, y, viewportState);

  const id = makeId();
  toolState.currentShapeId = id;

  const newShape: WhiteboardAnnotation = {
    id,
    type: 'pen',
    color,
    size,                 // stroke thickness in world units
    opacity,
    lineStyle: 'solid',
    points: [worldPoint], // WORLD coords
    timestamp: Date.now(),
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.addShape(newShape);

  e.preventDefault();
  e.stopPropagation();
  return true;
}

/** Pointer move — extend stroke */
export function handlePenPointerMove(
  e: PointerEvent,
  canvasElement: HTMLElement,
  viewport: ViewportTransform
): boolean {
  if (!toolState.isActive || !toolState.isDrawing || !toolState.currentShapeId) return false;

  const store = useWhiteboardStore.getState();
  const shape = store.shapes.get(toolState.currentShapeId);
  if (!shape) return false;

  const { x, y } = getPointerInCanvas(e, canvasElement);
  // Convert ViewportTransform to ViewportState (respecting DPR as SSOT)
  const rect = canvasElement.getBoundingClientRect();
  const viewportState = {
    ...viewport,
    width: rect.width,   // CSS pixels
    height: rect.height  // CSS pixels
  };
  const worldPoint = screenToWorld(x, y, viewportState);

  // Append point
  store.updateShape(toolState.currentShapeId, {
    points: shape.points ? [...shape.points, worldPoint] : [worldPoint],
    updatedAt: Date.now(),
  });

  e.preventDefault();
  return true;
}

/** Pointer up — finish stroke */
export function handlePenPointerUp(
  e: PointerEvent,
  canvasElement: HTMLElement
): boolean {
  if (!toolState.isActive || !toolState.isDrawing) return false;

  try {
    if (toolState.pointerId !== null) {
      canvasElement.releasePointerCapture(toolState.pointerId);
    } else {
      canvasElement.releasePointerCapture(e.pointerId);
    }
  } catch {
    // non-fatal
  }

  toolState.isDrawing = false;
  toolState.currentShapeId = null;
  toolState.pointerId = null;

  useWhiteboardStore.getState().saveHistory('draw');

  e.preventDefault();
  return true;
}

/**
 * Render a pen stroke (WORLD-SPACE).
 * WhiteboardCanvas has already applied DPR + viewport transforms to ctx.
 */
export function renderPenStroke(
  ctx: CanvasRenderingContext2D,
  points: WhiteboardPoint[],
  color: string,
  size: number,
  opacity: number,
  _viewport: ViewportTransform // unused in world-space render
): void {
  if (!points || points.length < 2) return;

  ctx.save();

  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = size;      // WORLD units
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // Simple path (you can add smoothing later if desired)
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}
