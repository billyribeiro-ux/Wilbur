import { describe, it, expect } from 'vitest';
import {
  screenToWorld,
  worldToScreen,
  getBounds,
  distance,
  lerp,
  clampZoom,
} from '../../../src/features/whiteboard/utils/transform';

describe('transform utilities', () => {
  const viewport = {
    panX: 0,
    panY: 0,
    zoom: 1,
    width: 1000,
    height: 800,
  } as any;

  describe('screenToWorld', () => {
    it('converts screen coordinates to world coordinates', () => {
      const result = screenToWorld(500, 400, viewport);
      expect(result.x).toBeCloseTo(0.5);
      expect(result.y).toBeCloseTo(0.5);
    });

    it('handles zoom correctly', () => {
      const zoomedViewport = { ...viewport, zoom: 2 } as any;
      const result = screenToWorld(500, 400, zoomedViewport);
      expect(result.x).toBeCloseTo(0.25);
      expect(result.y).toBeCloseTo(0.25);
    });

    it('handles pan correctly', () => {
      const pannedViewport = { ...viewport, panX: 0.1, panY: 0.1 } as any;
      const result = screenToWorld(500, 400, pannedViewport);
      expect(result.x).toBeCloseTo(0.4);
      expect(result.y).toBeCloseTo(0.4);
    });
  });

  describe('worldToScreen', () => {
    it('converts world coordinates to screen coordinates', () => {
      const result = worldToScreen({ x: 0.5, y: 0.5 }, viewport);
      expect(result.x).toBeCloseTo(500);
      expect(result.y).toBeCloseTo(400);
    });

    it('is inverse of screenToWorld', () => {
      const world = screenToWorld(300, 200, viewport);
      const screen = worldToScreen(world, viewport);
      expect(screen.x).toBeCloseTo(300);
      expect(screen.y).toBeCloseTo(200);
    });
  });

  describe('getBounds', () => {
    it('calculates bounding box for points', () => {
      const points = [
        { x: 0.1, y: 0.2 },
        { x: 0.5, y: 0.8 },
        { x: 0.3, y: 0.4 },
      ];
      const bounds = getBounds(points);
      expect(bounds.minX).toBe(0.1);
      expect(bounds.maxX).toBe(0.5);
      expect(bounds.minY).toBe(0.2);
      expect(bounds.maxY).toBe(0.8);
      expect(bounds.width).toBeCloseTo(0.4);
      expect(bounds.height).toBeCloseTo(0.6);
    });

    it('handles empty array', () => {
      const bounds = getBounds([]);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  describe('distance', () => {
    it('calculates distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(distance(p1, p2)).toBe(5);
    });

    it('returns 0 for same point', () => {
      const p = { x: 0.5, y: 0.5 };
      expect(distance(p, p)).toBe(0);
    });
  });

  describe('lerp', () => {
    it('interpolates between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 1, y: 1 };
      const mid = lerp(p1, p2, 0.5);
      expect(mid.x).toBe(0.5);
      expect(mid.y).toBe(0.5);
    });

    it('returns start point at t=0', () => {
      const p1 = { x: 0.2, y: 0.3 };
      const p2 = { x: 0.8, y: 0.9 };
      const result = lerp(p1, p2, 0);
      expect(result.x).toBe(p1.x);
      expect(result.y).toBe(p1.y);
    });

    it('returns end point at t=1', () => {
      const p1 = { x: 0.2, y: 0.3 };
      const p2 = { x: 0.8, y: 0.9 };
      const result = lerp(p1, p2, 1);
      expect(result.x).toBeCloseTo(p2.x);
      expect(result.y).toBeCloseTo(p2.y);
    });
  });

  describe('clampZoom', () => {
    it('clamps zoom to min', () => {
      expect(clampZoom(0.05, 0.1, 10)).toBe(0.1);
    });

    it('clamps zoom to max', () => {
      expect(clampZoom(15, 0.1, 10)).toBe(10);
    });

    it('returns value within range', () => {
      expect(clampZoom(5, 0.1, 10)).toBe(5);
    });
  });
});
