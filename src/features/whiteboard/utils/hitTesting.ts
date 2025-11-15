// ============================================================================
// HIT TESTING - Shape Selection & Eraser
// ============================================================================

import type { WhiteboardPoint, WhiteboardShape } from '../types';

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(
  point: WhiteboardPoint,
  segStart: WhiteboardPoint,
  segEnd: WhiteboardPoint
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  
  if (dx === 0 && dy === 0) {
    // Segment is a point
    const pdx = point.x - segStart.x;
    const pdy = point.y - segStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
  
  // Calculate projection
  const t = Math.max(0, Math.min(1, 
    ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / (dx * dx + dy * dy)
  ));
  
  const projX = segStart.x + t * dx;
  const projY = segStart.y + t * dy;
  
  const pdx = point.x - projX;
  const pdy = point.y - projY;
  
  return Math.sqrt(pdx * pdx + pdy * pdy);
}

/**
 * Check if point is within stroke
 */
export function isPointInStroke(
  point: WhiteboardPoint,
  stroke: WhiteboardShape,
  threshold: number
): boolean {
  if (stroke.points.length < 2) return false;
  
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const dist = distanceToSegment(point, stroke.points[i], stroke.points[i + 1]);
    if (dist <= threshold) return true;
  }
  
  return false;
}

/**
 * Check if point is within rectangle
 */
export function isPointInRectangle(
  point: WhiteboardPoint,
  rect: WhiteboardShape
): boolean {
  if (rect.points.length < 2) return false;
  
  const [p1, p2] = rect.points;
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Check if point is within circle
 */
export function isPointInCircle(
  point: WhiteboardPoint,
  circle: WhiteboardShape
): boolean {
  if (circle.points.length < 2) return false;
  
  const [center, edge] = circle.points;
  const radius = Math.sqrt(
    Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
  );
  
  const dist = Math.sqrt(
    Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
  );
  
  return dist <= radius;
}

/**
 * Get all shapes at point
 */
export function getShapesAtPoint(
  point: WhiteboardPoint,
  shapes: Map<string, WhiteboardShape>,
  threshold: number = 0.01
): WhiteboardShape[] {
  const hits: WhiteboardShape[] = [];
  
  shapes.forEach((shape) => {
    let isHit = false;
    
    switch (shape.type) {
      case 'pen':
      case 'highlighter':
      case 'line':
      case 'arrow':
        isHit = isPointInStroke(point, shape, threshold);
        break;
      
      case 'rectangle':
        isHit = isPointInRectangle(point, shape);
        break;
      
      case 'circle':
        isHit = isPointInCircle(point, shape);
        break;
      
      case 'text':
      case 'stamp':
        // Simple bounding box check
        if (shape.points.length > 0) {
          const p = shape.points[0];
          const size = shape.fontSize || shape.size || 16;
          isHit = Math.abs(point.x - p.x) < size / 100 && 
                  Math.abs(point.y - p.y) < size / 100;
        }
        break;
    }
    
    if (isHit) {
      hits.push(shape);
    }
  });
  
  return hits;
}

/**
 * Get topmost shape at point (by z-index)
 */
export function getTopmostShapeAtPoint(
  point: WhiteboardPoint,
  shapes: Map<string, WhiteboardShape>,
  threshold: number = 0.01
): WhiteboardShape | null {
  const hits = getShapesAtPoint(point, shapes, threshold);
  
  if (hits.length === 0) return null;
  
  // Sort by z-index (higher = on top)
  hits.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  
  return hits[0];
}
