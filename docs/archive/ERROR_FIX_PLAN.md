# ERROR FIX PLAN - 152 TypeScript Errors

**Date:** November 4, 2025
**Total Errors:** 152
**Strategy:** Surgical fixes, no deletions

---

## ERROR CATEGORIES

### 1. Store Methods Missing (16 errors)
- `updateEmoji` does not exist (10 errors)
- `deleteEmoji` does not exist (4 errors)
- `pushHistory` does not exist (6 errors)

**Fix:** Add these methods to `whiteboardStore.ts` or use existing alternatives

### 2. Unused @ts-expect-error (7 errors) ✅ FIXED
- PenTool, LineTool, ArrowTool, RectangleTool, HighlighterTool, EraserTool
- **Fix:** Removed unused directives

### 3. Missing drawStamp Function (8 errors)
- Cannot find name 'drawStamp'

**Fix:** Import or implement `drawStamp` function

### 4. Emoji Properties Possibly Undefined (14 errors)
- `emoji.x`, `emoji.y`, `emoji.scale`, `emoji.rotation` possibly undefined

**Fix:** Add nullish coalescing operators (`?? 0` or `?? 1`)

### 5. TextAnnotation Missing x/y Properties (8 errors)
- `Property 'x' does not exist on type 'TextAnnotation'`
- `Property 'y' does not exist on type 'TextAnnotation'`

**Fix:** Add `x` and `y` to `TextAnnotation` interface or use `position`

### 6. ViewportTransform Missing Properties (8 errors)
- `Property 'zoom' does not exist` (4 errors)
- `Property 'height' does not exist` (4 errors)

**Fix:** Use `viewport.a` for zoom, remove `height` property

### 7. Type Interface Issues (2 errors)
- `EmojiAnnotation` lineStyle incompatibility
- `TextAnnotation` size incompatibility

**Fix:** Make properties required or adjust types

### 8. Test File Errors (10 errors)
- Missing functions: `getBounds`, `distance`, `lerp`, `clampZoom`
- Unused import: `createTransform`

**Fix:** Import missing functions or implement them

### 9. Miscellaneous (remaining errors)
- `Property 'text' does not exist on type 'WhiteboardAnnotation'`
- `Property 'gradient' does not exist on type 'WhiteboardAnnotation'`
- History entry issues

---

## FIX ORDER (Priority)

1. ✅ Remove unused @ts-expect-error directives (7 errors)
2. Fix type interfaces (2 errors)
3. Fix emoji null guards (14 errors)
4. Fix TextAnnotation x/y properties (8 errors)
5. Fix ViewportTransform usage (8 errors)
6. Fix store methods (16 errors)
7. Fix drawStamp imports (8 errors)
8. Fix test file errors (10 errors)
9. Fix remaining miscellaneous errors

---

## DETAILED FIXES

### Fix 1: Type Interfaces ✅ NEXT
**Files:** `src/features/whiteboard/types.ts`

```typescript
// EmojiAnnotation - make lineStyle required
export interface EmojiAnnotation extends BaseAnnotation {
  type: 'emoji';
  emoji: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  lineStyle: LineStyle; // Remove | undefined
}

// TextAnnotation - make size required and add x/y
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  x: number; // ADD
  y: number; // ADD
  size: number; // Remove | undefined
  // ... rest
}
```

### Fix 2: Emoji Null Guards
**Files:** Multiple tool files and utils

```typescript
// Before
const x = emoji.x;
const y = emoji.y;
const scale = emoji.scale;

// After
const x = emoji.x ?? 0;
const y = emoji.y ?? 0;
const scale = emoji.scale ?? 1;
const rotation = emoji.rotation ?? 0;
```

### Fix 3: ViewportTransform Usage
**Files:** Multiple files using `viewport.zoom` or `viewport.height`

```typescript
// Before
const zoom = viewport.zoom;
const height = viewport.height;

// After
const zoom = viewport.a; // scale factor
// Remove height usage or calculate from bounds
```

### Fix 4: Store Methods
**Files:** `whiteboardStore.ts`

Need to check if these methods exist with different names:
- `updateEmoji` → might be `updateShape`
- `deleteEmoji` → might be `deleteShape`
- `pushHistory` → might be `saveHistory`

### Fix 5: drawStamp Function
**Files:** Multiple tool files

Need to find where `drawStamp` is defined or implement it.

---

## PROGRESS TRACKER

- [x] Unused @ts-expect-error (7/7)
- [ ] Type interfaces (0/2)
- [ ] Emoji null guards (0/14)
- [ ] TextAnnotation x/y (0/8)
- [ ] ViewportTransform (0/8)
- [ ] Store methods (0/16)
- [ ] drawStamp (0/8)
- [ ] Test files (0/10)
- [ ] Miscellaneous (0/remaining)

**Total Fixed:** 16/152 (10.5%)
**Remaining:** 136

## COMPLETED FIXES

### ✅ Batch 1: @ts-expect-error Directives (7 errors)
- Removed unused `@ts-expect-error` comments for `crypto.randomUUID()`
- Files: PenTool, LineTool, ArrowTool, RectangleTool, HighlighterTool, EraserTool

### ✅ Batch 2: Type Interface Fixes (9 errors)
- Fixed `EmojiAnnotation.lineStyle` - made required to match BaseAnnotation
- Fixed `TextAnnotation.size` - made required to match BaseAnnotation  
- Fixed `TextAnnotation.lineStyle` - made required to match BaseAnnotation
- Added `TextAnnotation.x` and `TextAnnotation.y` properties

## NEXT PRIORITY FIXES

### 1. Store Methods (20 errors) - HIGH PRIORITY
Need to check whiteboardStore.ts for:
- `updateEmoji` (10 errors) → likely `updateShape`
- `deleteEmoji` (4 errors) → likely `deleteShape`
- `pushHistory` (6 errors) → likely `saveHistory`

### 2. Emoji Null Guards (14 errors) - MEDIUM PRIORITY
Add nullish coalescing in:
- `emoji.x ?? 0` (4 errors)
- `emoji.y ?? 0` (4 errors)
- `emoji.scale ?? 1` (5 errors)
- `emoji.rotation ?? 0` (1 error)

### 3. ViewportTransform Properties (8 errors) - MEDIUM PRIORITY
- Replace `viewport.zoom` with `viewport.a` (4 errors)
- Remove `viewport.height` usage (4 errors)

### 4. drawStamp Function (8 errors) - MEDIUM PRIORITY
- Import or implement `drawStamp` function

### 5. Test File Errors (10 errors) - LOW PRIORITY
- Import missing utility functions
- Remove unused imports
