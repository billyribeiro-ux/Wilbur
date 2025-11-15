# Whiteboard System - File Map & Dependencies

## Core Whiteboard Files

### Entry Point
```
src/features/whiteboard/WhiteboardOverlay.tsx
├─→ components/WhiteboardCanvas.tsx
├─→ components/WhiteboardToolbar.tsx
├─→ components/RemoteCursors.tsx
├─→ state/whiteboardStore.ts
└─→ state/whiteboardCollab.ts
```

### Components
```
src/features/whiteboard/components/
├── WhiteboardCanvas.tsx
│   ├─→ hooks/usePointerDrawing.ts
│   ├─→ utils/drawPrimitives.ts
│   ├─→ state/whiteboardStore.ts
│   └─→ utils/transform.ts
│
├── WhiteboardToolbar.tsx
│   ├─→ state/whiteboardStore.ts
│   └─→ utils/exporters.ts
│
└── RemoteCursors.tsx
    ├─→ state/whiteboardStore.ts
    └─→ utils/transform.ts
```

### State Management
```
src/features/whiteboard/state/
├── whiteboardStore.ts (Zustand SSOT)
│   └─→ types.ts
│
└── whiteboardCollab.ts
    └─→ whiteboardStore.ts
```

### Utilities
```
src/features/whiteboard/utils/
├── drawPrimitives.ts
│   └─→ transform.ts
│
├── transform.ts
│   └─→ types.ts
│
├── undoRedo.ts
│   └─→ types.ts
│
├── exporters.ts
│   └─→ types.ts
│
└── perfProbe.ts
```

### Hooks
```
src/features/whiteboard/hooks/
└── usePointerDrawing.ts
    ├─→ state/whiteboardStore.ts
    └─→ utils/transform.ts
```

### Types
```
src/features/whiteboard/types.ts
(No dependencies - pure types)
```

### Services
```
src/services/CompositorService.ts
(Standalone - used by recording integration)
```

## Related Files (Non-Whiteboard)

### Integration Points
```
src/components/trading/TradingRoomLayout.tsx
└─→ features/whiteboard/WhiteboardOverlay.tsx

src/components/trading/TradingRoomContainer.tsx
└─→ features/whiteboard/types.ts (WhiteboardEvent)

src/components/icons/EmojiPicker.tsx
(Separate component - not integrated with whiteboard)
```

## Dependency Graph

```
                    ┌─────────────────────┐
                    │ WhiteboardOverlay   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Canvas    │  │   Toolbar    │  │RemoteCursors │
    └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
           │                │                  │
           │                │                  │
           └────────────────┼──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ whiteboardStore  │
                  └────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │drawPrims │  │transform │  │undoRedo  │
      └──────────┘  └──────────┘  └──────────┘
```

## Current Issues Identified

### 1. Eraser Tool ❌
**Location:** `drawPrimitives.ts`, `WhiteboardCanvas.tsx`
**Issue:** No eraser implementation beyond basic stroke removal
**Missing:**
- Area/pixel eraser mode
- Hit-testing for stroke selection
- Proper invalidation

### 2. Undo/Redo ❌
**Location:** `whiteboardStore.ts`, `undoRedo.ts`
**Issue:** Basic history exists but:
- No keyboard shortcuts (Cmd+Z)
- History saved per pointermove (not transactional)
- No grouping of drag operations

### 3. Emoji/Stamp Tool ⚠️
**Location:** `drawPrimitives.ts`, `types.ts`
**Issue:** Basic stamp exists but:
- No selection handles
- No rotation/scaling
- No proper hit-testing
- Fixed size only

### 4. Draggable Toolbars ❌
**Location:** `WhiteboardToolbar.tsx`
**Issue:** 
- Toolbar is fixed position
- Not draggable
- Not resizable
- No position persistence

### 5. Pointer Coalescing ❌
**Location:** `usePointerDrawing.ts`
**Issue:** 
- No event coalescing
- Processes every pointermove
- Performance impact

### 6. DPR/Canvas Scaling ⚠️
**Location:** `WhiteboardCanvas.tsx`
**Issue:**
- Canvas size set but DPR not considered
- May appear blurry on high-DPI displays

## Files Requiring Changes

### Bug Fix Pack 1 (Critical)
```
✏️ src/features/whiteboard/utils/drawPrimitives.ts
   - Add area eraser implementation
   - Add hit-testing for strokes

✏️ src/features/whiteboard/components/WhiteboardCanvas.tsx
   - Add keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
   - Fix DPR scaling
   - Add pointer coalescing

✏️ src/features/whiteboard/hooks/usePointerDrawing.ts
   - Implement event coalescing
   - Add transactional history grouping

✏️ src/features/whiteboard/state/whiteboardStore.ts
   - Add keyboard shortcut handlers
   - Fix history grouping

✏️ src/features/whiteboard/components/WhiteboardToolbar.tsx
   - Make draggable
   - Add resize handles
   - Persist position

✏️ src/features/whiteboard/utils/undoRedo.ts
   - Add transaction grouping
   - Add memory-safe compaction

🆕 src/features/whiteboard/utils/hitTesting.ts
   - Stroke hit-testing
   - Shape hit-testing
   - Emoji hit-testing

🆕 src/features/whiteboard/components/SelectionHandles.tsx
   - Selection box
   - Resize handles
   - Rotation handle
```

### Feature Pack 2 (Zoom-Parity)
```
🆕 src/features/whiteboard/components/TextEditor.tsx
   - Inline text editing
   - Font controls

🆕 src/features/whiteboard/components/StickyNote.tsx
   - Sticky note component

🆕 src/features/whiteboard/components/LaserPointer.tsx
   - Transient laser trail

🆕 src/features/whiteboard/utils/shapeGeometry.ts
   - Shape calculations
   - Rotation math

✏️ src/features/whiteboard/types.ts
   - Add missing tool types
   - Add selection types
   - Add layer types

✏️ src/features/whiteboard/state/whiteboardStore.ts
   - Add layer management
   - Add group/ungroup
   - Add permissions
```

## Metrics to Track

### Performance
- Input → Paint latency (target: ≤ 16.6ms p95)
- RAF stability (target: 60fps sustained)
- Memory usage (target: stable over 30min)

### Functionality
- All tools working
- Undo/redo working
- Keyboard shortcuts working
- Toolbar draggable
- Export working

## Test Coverage Needed

### Unit Tests
- [ ] Eraser hit-testing
- [ ] History transactions
- [ ] Emoji transforms
- [ ] Shape geometry
- [ ] Hit-testing algorithms

### Integration Tests
- [ ] Draw and erase
- [ ] Undo/redo flow
- [ ] Emoji place/scale/rotate
- [ ] Toolbar drag/resize
- [ ] Pan/zoom
- [ ] Export PNG/SVG
- [ ] Overlay mode

### Performance Tests
- [ ] Input latency
- [ ] Memory stability
- [ ] RAF consistency
