// ============================================================================
// UNDO/REDO SYSTEM - History Management
// ============================================================================
// Bounded history stack with coalescing for continuous strokes
// ============================================================================

import type { WhiteboardShape, WhiteboardHistoryEntry } from '../types';

/**
 * Create a history entry from current shapes
 */
export function createHistoryEntry(
  shapes: Map<string, WhiteboardShape>,
  action: string
): WhiteboardHistoryEntry {
  return {
    shapes: new Map(shapes),
    timestamp: Date.now(),
    action,
  };
}

/**
 * Check if two actions should be coalesced (combined into one history entry)
 */
export function shouldCoalesce(
  lastEntry: WhiteboardHistoryEntry | undefined,
  currentAction: string,
  coalesceWindow = 1000 // 1 second
): boolean {
  if (!lastEntry) return false;
  
  // Only coalesce continuous drawing actions
  if (currentAction !== 'draw' || lastEntry.action !== 'draw') {
    return false;
  }
  
  // Check if within time window
  const timeDiff = Date.now() - lastEntry.timestamp;
  return timeDiff < coalesceWindow;
}

/**
 * Add a new history entry, respecting max size and coalescing
 */
export function addHistoryEntry(
  history: WhiteboardHistoryEntry[],
  historyIndex: number,
  newEntry: WhiteboardHistoryEntry,
  maxSize: number,
  shouldCoalesceEntry = false
): { history: WhiteboardHistoryEntry[]; historyIndex: number } {
  // Truncate future history if we're not at the end
  let newHistory = history.slice(0, historyIndex + 1);
  
  // Coalesce if appropriate
  if (shouldCoalesceEntry && newHistory.length > 0) {
    // Replace last entry instead of adding new one
    newHistory[newHistory.length - 1] = newEntry;
  } else {
    // Add new entry
    newHistory.push(newEntry);
  }
  
  // Limit history size (keep most recent)
  if (newHistory.length > maxSize) {
    newHistory = newHistory.slice(newHistory.length - maxSize);
  }
  
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

/**
 * Undo to previous history entry
 */
export function undo(
  history: WhiteboardHistoryEntry[],
  historyIndex: number
): {
  shapes: Map<string, WhiteboardShape> | null;
  historyIndex: number;
} {
  if (historyIndex <= 0) {
    return { shapes: null, historyIndex };
  }
  
  const newIndex = historyIndex - 1;
  const entry = history[newIndex];
  
  return {
    shapes: entry ? new Map(entry.shapes) : null,
    historyIndex: newIndex,
  };
}

/**
 * Redo to next history entry
 */
export function redo(
  history: WhiteboardHistoryEntry[],
  historyIndex: number
): {
  shapes: Map<string, WhiteboardShape> | null;
  historyIndex: number;
} {
  if (historyIndex >= history.length - 1) {
    return { shapes: null, historyIndex };
  }
  
  const newIndex = historyIndex + 1;
  const entry = history[newIndex];
  
  return {
    shapes: entry ? new Map(entry.shapes) : null,
    historyIndex: newIndex,
  };
}

/**
 * Check if undo is available
 */
export function canUndo(historyIndex: number): boolean {
  return historyIndex > 0;
}

/**
 * Check if redo is available
 */
export function canRedo(history: WhiteboardHistoryEntry[], historyIndex: number): boolean {
  return historyIndex < history.length - 1;
}
