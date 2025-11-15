// ============================================================================
// CROSSHAIR DEBUG - Visual pointer alignment probe (L65 diagnostic)
// ============================================================================
// Draws a crosshair at pointer position to visually verify alignment.
// Use temporarily to prove cursor and drawing coordinates match.
// ============================================================================

/**
 * Draw a crosshair at the given screen coordinates.
 * Use to verify pointer alignment during development.
 */
export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.strokeStyle = '#ff0066';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
  ctx.restore();
}
