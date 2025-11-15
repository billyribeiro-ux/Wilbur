# Whiteboard Annotation Feature

## Overview
The whiteboard feature allows administrators to annotate shared screens in real-time during trading room sessions. This provides a Zoom-like collaborative drawing experience.

## Transform System Specification

### Coordinate Systems

**World Coordinates**:
- Continuous 2D plane representing logical drawing space
- Units: Logical pixels (CSS pixels at zoom=1)
- Origin: Top-left corner (0, 0)
- Usage: Shape storage, calculations, hit testing

**Screen Coordinates**:
- Visible viewport area on user's screen
- Units: CSS pixels
- Origin: Top-left corner of canvas element
- Usage: Mouse/touch events, canvas rendering

### Viewport Transform
```typescript
interface ViewportTransform {
  a: number; // scaleX (horizontal zoom)
  d: number; // scaleY (vertical zoom)
  e: number; // translateX (horizontal pan)
  f: number; // translateY (vertical pan)
  b: number; // skewY (always 0)
  c: number; // skewX (always 0)
}
```

### Transform Functions
```typescript
// Screen to World: Used for pointer events
function screenToWorld(screenX: number, screenY: number, transform: ViewportTransform): WhiteboardPoint {
  const { a, d, e, f } = transform;
  const worldX = (screenX - e) / a;
  const worldY = (screenY - f) / d;
  return { x: worldX, y: worldY };
}

// World to Screen: Used for canvas rendering
function worldToScreen(point: WhiteboardPoint, transform: ViewportTransform): { x: number; y: number } {
  const { a, d, e, f } = transform;
  const screenX = point.x * a + e;
  const screenY = point.y * d + f;
  return { x: screenX, y: screenY };
}
```

### Implementation Guidelines
**DO**:
- Use `screenToWorld()` for pointer events
- Use `worldToScreen()` for canvas rendering
- Store shapes in world coordinates
- Use logical pixels for all calculations

**DON'T**:
- Apply DPR transforms to canvas context
- Mix coordinate systems
- Store screen coordinates in shapes
- Use ad-hoc transform math

### Device Pixel Ratio (DPR) Policy
All coordinate calculations use logical CSS pixels. DPR is handled at canvas level:
- Canvas physical size = logical size × DPR
- Canvas context uses identity transform (no DPR scaling)
- Browser handles DPR scaling automatically

## Features (Phase 1)
- **Admin-only access**: Only room administrators can draw and manage annotations
- **Drawing tools**: Pen, highlighter, and eraser
- **Color palette**: 6 preset colors for annotations
- **Stroke width control**: Adjustable size for each tool
- **Undo/Clear**: Remove last stroke or clear all annotations
- **Real-time sync**: All participants see annotations instantly via LiveKit data channels

## Usage
1. Ensure you have administrator privileges in the trading room
2. Navigate to the "Screens" tab
3. Click the whiteboard icon (📝) in the header toolbar
4. The toolbar appears at the bottom of the screen
5. Select a tool and start drawing on the shared screen

## Technical Implementation
- **Component**: `WhiteboardOverlay.tsx`
- **Types**: `whiteboardTypes.ts`
- **Events**: Synchronized via LiveKit data channel with reliable delivery
- **Canvas**: HTML5 Canvas with normalized coordinates (0-1 range)
- **State management**: Local React state with event broadcasting

## Event Schema
```typescript
interface WhiteboardEvent {
  type: 'stroke:start' | 'stroke:update' | 'stroke:end' | 'stroke:undo' | 'stroke:clear';
  roomId: string;
  userId: string;
  timestamp: number;
  payload: WhiteboardEventPayload;
}
```

## Future Phases
- Shape tools (rectangle, circle, arrow)
- Text annotations
- Laser pointer mode
- Export to image
- Persistent storage
- Multi-user collaboration with user identification
