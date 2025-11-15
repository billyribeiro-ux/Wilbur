import { describe, it, expect } from 'vitest';
import {
  createHistoryEntry,
  shouldCoalesce,
  addHistoryEntry,
  undo,
  redo,
  canUndo,
  canRedo,
} from '../../../src/features/whiteboard/utils/undoRedo';
import type { WhiteboardShape } from '../../../src/features/whiteboard/types';

describe('undoRedo utilities', () => {
  const createTestShape = (id: string): WhiteboardShape => ({
    id,
    type: 'pen',
    color: '#000000',
    size: 3,
    opacity: 1,
    lineStyle: 'solid',
    points: [{ x: 0.5, y: 0.5 }],
    timestamp: Date.now(),
  });

  describe('createHistoryEntry', () => {
    it('creates history entry with shapes', () => {
      const shapes = new Map([['1', createTestShape('1')]]);
      const entry = createHistoryEntry(shapes, 'draw');
      
      expect(entry.shapes.size).toBe(1);
      expect(entry.action).toBe('draw');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('creates independent copy of shapes', () => {
      const shapes = new Map([['1', createTestShape('1')]]);
      const entry = createHistoryEntry(shapes, 'draw');
      
      shapes.set('2', createTestShape('2'));
      expect(entry.shapes.size).toBe(1);
    });
  });

  describe('shouldCoalesce', () => {
    it('returns false for non-draw actions', () => {
      const entry = createHistoryEntry(new Map(), 'delete');
      expect(shouldCoalesce(entry, 'draw')).toBe(false);
    });

    it('returns true for recent draw actions', () => {
      const entry = createHistoryEntry(new Map(), 'draw');
      expect(shouldCoalesce(entry, 'draw', 2000)).toBe(true);
    });

    it('returns false for old draw actions', () => {
      const entry = {
        shapes: new Map(),
        timestamp: Date.now() - 5000,
        action: 'draw',
      };
      expect(shouldCoalesce(entry, 'draw', 1000)).toBe(false);
    });
  });

  describe('addHistoryEntry', () => {
    it('adds new entry to history', () => {
      const history = [createHistoryEntry(new Map(), 'init')];
      const newEntry = createHistoryEntry(new Map([['1', createTestShape('1')]]), 'draw');
      
      const result = addHistoryEntry(history, 0, newEntry, 100, false);
      
      expect(result.history.length).toBe(2);
      expect(result.historyIndex).toBe(1);
    });

    it('truncates future history when not at end', () => {
      const history = [
        createHistoryEntry(new Map(), 'init'),
        createHistoryEntry(new Map([['1', createTestShape('1')]]), 'draw'),
        createHistoryEntry(new Map([['2', createTestShape('2')]]), 'draw'),
      ];
      const newEntry = createHistoryEntry(new Map([['3', createTestShape('3')]]), 'draw');
      
      const result = addHistoryEntry(history, 1, newEntry, 100, false);
      
      expect(result.history.length).toBe(3);
      expect(result.historyIndex).toBe(2);
    });

    it('limits history size', () => {
      const history = Array.from({ length: 5 }, (_, i) =>
        createHistoryEntry(new Map([[String(i), createTestShape(String(i))]]), 'draw')
      );
      const newEntry = createHistoryEntry(new Map([['6', createTestShape('6')]]), 'draw');
      
      const result = addHistoryEntry(history, 4, newEntry, 5, false);
      
      expect(result.history.length).toBe(5);
    });

    it('coalesces when requested', () => {
      const history = [createHistoryEntry(new Map(), 'init')];
      const newEntry = createHistoryEntry(new Map([['1', createTestShape('1')]]), 'draw');
      
      const result = addHistoryEntry(history, 0, newEntry, 100, true);
      
      expect(result.history.length).toBe(1);
      expect(result.history[0].shapes.size).toBe(1);
    });
  });

  describe('undo', () => {
    it('moves to previous history entry', () => {
      const history = [
        createHistoryEntry(new Map(), 'init'),
        createHistoryEntry(new Map([['1', createTestShape('1')]]), 'draw'),
      ];
      
      const result = undo(history, 1);
      
      expect(result.historyIndex).toBe(0);
      expect(result.shapes?.size).toBe(0);
    });

    it('returns null when at start', () => {
      const history = [createHistoryEntry(new Map(), 'init')];
      
      const result = undo(history, 0);
      
      expect(result.historyIndex).toBe(0);
      expect(result.shapes).toBeNull();
    });
  });

  describe('redo', () => {
    it('moves to next history entry', () => {
      const history = [
        createHistoryEntry(new Map(), 'init'),
        createHistoryEntry(new Map([['1', createTestShape('1')]]), 'draw'),
      ];
      
      const result = redo(history, 0);
      
      expect(result.historyIndex).toBe(1);
      expect(result.shapes?.size).toBe(1);
    });

    it('returns null when at end', () => {
      const history = [createHistoryEntry(new Map(), 'init')];
      
      const result = redo(history, 0);
      
      expect(result.historyIndex).toBe(0);
      expect(result.shapes).toBeNull();
    });
  });

  describe('canUndo', () => {
    it('returns true when not at start', () => {
      expect(canUndo(1)).toBe(true);
    });

    it('returns false when at start', () => {
      expect(canUndo(0)).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('returns true when not at end', () => {
      const history = [
        createHistoryEntry(new Map(), 'init'),
        createHistoryEntry(new Map(), 'draw'),
      ];
      expect(canRedo(history, 0)).toBe(true);
    });

    it('returns false when at end', () => {
      const history = [createHistoryEntry(new Map(), 'init')];
      expect(canRedo(history, 0)).toBe(false);
    });
  });
});
