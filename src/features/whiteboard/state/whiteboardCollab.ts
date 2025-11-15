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
  
  switch (event.type) {
    case 'shape:add':
      if ('shape' in event.payload) {
        store.addShape(event.payload.shape);
      }
      break;
      
    case 'shape:update':
      if ('shape' in event.payload) {
        const shape = event.payload.shape;
        store.updateShape(shape.id, shape);
      }
      break;
      
    case 'shape:delete':
      if ('shapeId' in event.payload) {
        store.deleteShape(event.payload.shapeId);
      }
      break;
      
    case 'cursor:move':
      if ('cursor' in event.payload) {
        store.updateRemoteCursor(event.userId, event.payload.cursor);
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
