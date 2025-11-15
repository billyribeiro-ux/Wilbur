// ============================================================================
// WHITEBOARD COLLABORATION - Real-time Sync
// ============================================================================
// Collaboration adapter for LiveKit/Supabase Realtime
// ============================================================================

import type { WhiteboardEvent, WhiteboardShape, RemoteCursor } from '../types';
import { useWhiteboardStore } from './whiteboardStore';

/**
 * Process incoming collaboration event
 */
export function processIncomingEvent(event: WhiteboardEvent): void {
  const store = useWhiteboardStore.getState();
  const payload = event.payload as any; // Runtime type checking done below

  switch (event.type) {
    case 'shape:add':
      if (payload && 'shape' in payload && payload.shape) {
        store.addShape(payload.shape as WhiteboardShape);
      }
      break;

    case 'shape:update':
      if (payload && 'shape' in payload && payload.shape) {
        const shape = payload.shape as WhiteboardShape;
        store.updateShape(shape.id, shape);
      }
      break;

    case 'shape:delete':
      if (payload && 'shapeId' in payload && typeof payload.shapeId === 'string') {
        store.deleteShape(payload.shapeId);
      }
      break;

    case 'cursor:move':
      if (payload && 'cursor' in payload && payload.cursor) {
        store.updateRemoteCursor(event.userId, payload.cursor as RemoteCursor);
      }
      break;

    case 'stroke:clear':
      store.clearShapes();
      break;
  }
}

/**
 * Create collaboration event for broadcasting
 */
export function createCollabEvent(
  type: WhiteboardEvent['type'],
  roomId: string,
  userId: string,
  payload: WhiteboardEvent['payload']
): WhiteboardEvent {
  return {
    type,
    roomId,
    userId,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Broadcast shape add event
 */
export function broadcastShapeAdd(
  shape: WhiteboardShape,
  roomId: string,
  userId: string,
  emit?: (event: WhiteboardEvent) => void
): void {
  if (!emit) return;
  
  const event = createCollabEvent('shape:add', roomId, userId, { shape });
  emit(event);
}

/**
 * Broadcast cursor move event
 */
export function broadcastCursorMove(
  cursor: RemoteCursor,
  roomId: string,
  userId: string,
  emit?: (event: WhiteboardEvent) => void
): void {
  if (!emit) return;
  
  const event = createCollabEvent('cursor:move', roomId, userId, { cursor });
  emit(event);
}

/**
 * Remove stale remote cursors (older than 5 seconds)
 */
export function cleanupStaleCursors(): void {
  const store = useWhiteboardStore.getState();
  const now = Date.now();
  const staleThreshold = 5000; // 5 seconds
  
  store.remoteCursors.forEach((cursor, userId) => {
    if (now - cursor.timestamp > staleThreshold) {
      store.removeRemoteCursor(userId);
    }
  });
}

/**
 * Initialize collaboration cleanup interval
 */
export function startCollabCleanup(): () => void {
  const interval = setInterval(cleanupStaleCursors, 1000);
  
  return () => clearInterval(interval);
}
