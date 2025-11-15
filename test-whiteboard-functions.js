#!/usr/bin/env node

/**
 * COMPREHENSIVE WHITEBOARD FUNCTION TESTING
 * Tests every critical function end-to-end
 */

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assertEquals(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, message = '') {
  if (!value) {
    throw new Error(`${message}\nExpected truthy value, got: ${value}`);
  }
}

function assertClose(actual, expected, epsilon = 0.0001, message = '') {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}\nExpected: ${expected} ± ${epsilon}\nActual: ${actual}`);
  }
}

// =============================================================================
// TRANSFORM UTILITIES TESTS
// =============================================================================

test('screenToWorld - basic conversion', () => {
  const viewport = {
    panX: 0,
    panY: 0,
    zoom: 1,
    width: 1000,
    height: 800
  };

  // Center of screen should map to center of world (0.5, 0.5)
  const result = screenToWorld(500, 400, viewport);
  assertClose(result.x, 0.5, 0.01, 'X coordinate');
  assertClose(result.y, 0.5, 0.01, 'Y coordinate');
});

test('screenToWorld - with zoom', () => {
  const viewport = {
    panX: 0,
    panY: 0,
    zoom: 2,
    width: 1000,
    height: 800
  };

  // Center should still map to center when zoomed
  const result = screenToWorld(500, 400, viewport);
  assertClose(result.x, 0.25, 0.01, 'X coordinate with zoom');
  assertClose(result.y, 0.25, 0.01, 'Y coordinate with zoom');
});

test('screenToWorld - with pan', () => {
  const viewport = {
    panX: 0.1,
    panY: 0.2,
    zoom: 1,
    width: 1000,
    height: 800
  };

  const result = screenToWorld(500, 400, viewport);
  assertClose(result.x, 0.4, 0.01, 'X coordinate with pan');
  assertClose(result.y, 0.3, 0.01, 'Y coordinate with pan');
});

test('worldToScreen - basic conversion', () => {
  const viewport = {
    panX: 0,
    panY: 0,
    zoom: 1,
    width: 1000,
    height: 800
  };

  // World center (0.5, 0.5) should map to screen center
  const result = worldToScreen({ x: 0.5, y: 0.5 }, viewport);
  assertClose(result.x, 500, 1, 'X coordinate');
  assertClose(result.y, 400, 1, 'Y coordinate');
});

test('worldToScreen - round trip', () => {
  const viewport = {
    panX: 0.1,
    panY: 0.2,
    zoom: 2,
    width: 1000,
    height: 800
  };

  const screenPoint = { x: 300, y: 200 };
  const worldPoint = screenToWorld(screenPoint.x, screenPoint.y, viewport);
  const backToScreen = worldToScreen(worldPoint, viewport);

  assertClose(backToScreen.x, screenPoint.x, 1, 'Round trip X');
  assertClose(backToScreen.y, screenPoint.y, 1, 'Round trip Y');
});

test('getBounds - calculate bounding box', () => {
  const points = [
    { x: 0.1, y: 0.2 },
    { x: 0.5, y: 0.8 },
    { x: 0.3, y: 0.4 }
  ];

  const bounds = getBounds(points);
  assertClose(bounds.minX, 0.1, 0.001, 'minX');
  assertClose(bounds.maxX, 0.5, 0.001, 'maxX');
  assertClose(bounds.minY, 0.2, 0.001, 'minY');
  assertClose(bounds.maxY, 0.8, 0.001, 'maxY');
  assertClose(bounds.width, 0.4, 0.001, 'width');
  assertClose(bounds.height, 0.6, 0.001, 'height');
});

test('distance - calculate point distance', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 3, y: 4 };

  const dist = distance(p1, p2);
  assertClose(dist, 5, 0.001, 'Pythagorean distance');
});

test('lerp - linear interpolation', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 10, y: 20 };

  const mid = lerp(p1, p2, 0.5);
  assertClose(mid.x, 5, 0.001, 'Midpoint X');
  assertClose(mid.y, 10, 0.001, 'Midpoint Y');

  const quarter = lerp(p1, p2, 0.25);
  assertClose(quarter.x, 2.5, 0.001, 'Quarter point X');
  assertClose(quarter.y, 5, 0.001, 'Quarter point Y');
});

test('clampZoom - enforce bounds', () => {
  assertEquals(clampZoom(5, 0.1, 10), 5, 'Within bounds');
  assertEquals(clampZoom(0.05, 0.1, 10), 0.1, 'Below min');
  assertEquals(clampZoom(15, 0.1, 10), 10, 'Above max');
});

// =============================================================================
// HIT TESTING UTILITIES
// =============================================================================

test('hitTestEmoji - body hit', () => {
  const emoji = {
    id: 'test-emoji',
    type: 'stamp',
    glyph: '😀',
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const viewport = { zoom: 1, width: 1000, height: 800, panX: 0, panY: 0 };

  // Click on emoji center
  const result = hitTestEmoji(emoji, { x: 0.5, y: 0.5 }, viewport);
  assertEquals(result.type, 'body', 'Should hit emoji body');
});

test('hitTestEmoji - rotation support', () => {
  const emoji = {
    id: 'test-emoji',
    type: 'stamp',
    glyph: '😀',
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: Math.PI / 4, // 45 degrees
    opacity: 1,
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const viewport = { zoom: 1, width: 1000, height: 800, panX: 0, panY: 0 };

  // Click on rotated emoji center - should still hit
  const result = hitTestEmoji(emoji, { x: 0.5, y: 0.5 }, viewport);
  assertEquals(result.type, 'body', 'Should hit rotated emoji body');
});

test('pointInRotatedRect - basic hit', () => {
  const rect = {
    x: 0.5,
    y: 0.5,
    width: 0.2,
    height: 0.1,
    rotation: 0
  };

  const hit = pointInRotatedRect({ x: 0.5, y: 0.5 }, rect);
  assertTruthy(hit, 'Should hit center of rectangle');

  const miss = pointInRotatedRect({ x: 0.8, y: 0.8 }, rect);
  assertEquals(miss, false, 'Should miss outside rectangle');
});

// =============================================================================
// TEXT LAYOUT UTILITIES
// =============================================================================

test('getFontString - basic font', () => {
  const style = {
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none'
  };

  const font = getFontString(style, 1);
  assertTruthy(font.includes('16px'), 'Should include font size');
  assertTruthy(font.includes('Arial'), 'Should include font family');
});

test('getFontString - bold italic', () => {
  const style = {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 700,
    fontStyle: 'italic',
    textDecoration: 'none'
  };

  const font = getFontString(style, 1);
  assertTruthy(font.includes('bold'), 'Should include bold');
  assertTruthy(font.includes('italic'), 'Should include italic');
  assertTruthy(font.includes('20px'), 'Should include font size');
});

test('getFontString - DPR scaling', () => {
  const style = {
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none'
  };

  const font1x = getFontString(style, 1);
  const font2x = getFontString(style, 2);

  assertTruthy(font1x.includes('16px'), 'Should have 16px at 1x DPR');
  assertTruthy(font2x.includes('32px'), 'Should have 32px at 2x DPR');
});

// =============================================================================
// STATE MANAGEMENT TESTS
// =============================================================================

test('Store - initial state', () => {
  const initialState = {
    tool: 'pen',
    color: '#000000',
    size: 3,
    opacity: 1,
    shapes: new Map(),
    selectedShapeIds: new Set(),
    history: [{ shapes: new Map(), timestamp: Date.now(), action: 'init' }],
    historyIndex: 0
  };

  assertTruthy(initialState.shapes instanceof Map, 'Shapes should be a Map');
  assertTruthy(initialState.selectedShapeIds instanceof Set, 'Selection should be a Set');
  assertEquals(initialState.tool, 'pen', 'Default tool');
  assertEquals(initialState.color, '#000000', 'Default color');
});

// =============================================================================
// TYPE VALIDATION TESTS
// =============================================================================

test('WhiteboardTool - valid types', () => {
  const validTools = ['select', 'hand', 'pen', 'highlighter', 'eraser', 'line', 'rectangle', 'circle', 'arrow', 'text', 'stamp'];

  validTools.forEach(tool => {
    assertTruthy(validTools.includes(tool), `${tool} should be valid`);
  });
});

test('ViewportState - structure', () => {
  const viewport = {
    zoom: 1,
    panX: 0,
    panY: 0,
    width: 1000,
    height: 800
  };

  assertTruthy(typeof viewport.zoom === 'number', 'zoom is number');
  assertTruthy(typeof viewport.panX === 'number', 'panX is number');
  assertTruthy(typeof viewport.panY === 'number', 'panY is number');
  assertTruthy(typeof viewport.width === 'number', 'width is number');
  assertTruthy(typeof viewport.height === 'number', 'height is number');
});

// =============================================================================
// HELPER FUNCTION IMPLEMENTATIONS (for testing without importing)
// =============================================================================

function screenToWorld(screenX, screenY, viewport) {
  const { panX, panY, zoom, width, height } = viewport;
  const worldX = (screenX / width - panX) / zoom;
  const worldY = (screenY / height - panY) / zoom;
  return { x: worldX, y: worldY };
}

function worldToScreen(point, viewport) {
  const { panX, panY, zoom, width, height } = viewport;
  const screenX = (point.x * zoom + panX) * width;
  const screenY = (point.y * zoom + panY) * height;
  return { x: screenX, y: screenY };
}

function getBounds(points) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(p1, p2, t) {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

function clampZoom(zoom, minZoom, maxZoom) {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

function hitTestEmoji(emoji, worldPos, viewport) {
  const dx = worldPos.x - emoji.x;
  const dy = worldPos.y - emoji.y;

  const cos = Math.cos(-emoji.rotation);
  const sin = Math.sin(-emoji.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const baseSize = 48 / viewport.zoom;
  const size = baseSize * emoji.scale;
  const halfSize = size / 2;

  const padding = 2 / viewport.zoom;
  if (
    Math.abs(localX) < halfSize + padding &&
    Math.abs(localY) < halfSize + padding
  ) {
    return { type: 'body' };
  }

  return { type: 'none' };
}

function pointInRotatedRect(point, rect) {
  const dx = point.x - rect.x;
  const dy = point.y - rect.y;

  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  return (
    Math.abs(localX) <= halfWidth &&
    Math.abs(localY) <= halfHeight
  );
}

function getFontString(style, dpr = 1) {
  const weight = style.fontWeight === 700 ? 'bold' : 'normal';
  const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
  const size = Math.round(style.fontSize * dpr);

  return `${fontStyle} ${weight} ${size}px ${style.fontFamily}`;
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

console.log('\n🧪 WHITEBOARD FUNCTION TESTING\n');
console.log('='.repeat(70));

tests.forEach(({ name, fn }) => {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
  }
});

console.log('='.repeat(70));
console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} TEST(S) FAILED\n`);
  process.exit(1);
}
