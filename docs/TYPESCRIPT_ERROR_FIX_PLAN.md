# TypeScript Error Fix Plan
**Total Errors:** 203  
**Date:** 2025-11-19

---

## Error Categories

| Error Code | Count | Description | Priority |
|------------|-------|-------------|----------|
| TS2339 | 114 | Property does not exist on type | 🔴 HIGH |
| TS2322 | 19 | Type not assignable | 🟡 MEDIUM |
| TS7006 | 18 | Implicit any parameter | 🟡 MEDIUM |
| TS18048 | 18 | Possibly undefined | 🟡 MEDIUM |
| TS2353 | 9 | Object literal unknown properties | 🟢 LOW |
| TS2307 | 7 | Cannot find module | 🔴 HIGH |
| TS2305 | 7 | Module has no exported member | 🔴 HIGH |
| TS2345 | 6 | Argument type not assignable | 🟡 MEDIUM |
| Other | 5 | Various | 🟢 LOW |

---

## Root Causes Identified

### 1. **Whiteboard Type Mismatches** (70+ errors)

#### Missing Properties on Types:
- `EmojiObject` missing: `zIndex`, `glyph`
- `ViewportState` missing: `zoom`, `width`, `height`
- `WhiteboardShape` missing: `gradient`, `composite`, `points` (on base union)
- `WhiteboardEvent` missing: `payload`, `userId`, `roomId`
- `RemoteCursor` missing: `position`

#### Type Union Issues:
- `WhiteboardShape` union doesn't properly discriminate between shape types
- Properties like `points`, `gradient`, `composite` only exist on specific shape types
- Code accessing these properties without type narrowing

---

### 2. **Module Import Errors** (14 errors)

#### react-router-dom Issues:
- `withRouter` not exported (deprecated in v6)
- `RouterChildContext` not exported
- `useHistory` not exported (replaced with `useNavigate`)
- `useRouteMatch` not exported (replaced with `useMatch`)

#### import.meta.env Issues:
- TypeScript config doesn't recognize Vite's `import.meta.env`
- Need to add Vite type definitions

---

### 3. **Implicit Any & Undefined** (36 errors)

#### Test Files:
- `schemaVerification.ts` - missing type annotations on parameters
- `themeSystemTest.ts` - missing type annotations
- `performance.ts` - missing type annotations

#### Missing Null Checks:
- Accessing properties on possibly undefined objects
- Need optional chaining or type guards

---

## Fix Strategy

### Phase 1: Fix Type Definitions (Priority 🔴)

#### 1.1 Extend Whiteboard Types
```typescript
// Add missing properties to types.ts

export interface EmojiObject extends WhiteboardShapeBase {
  type: 'emoji';
  emoji: string;
  size: number;
  native?: boolean;
  zIndex?: number;  // ADD
  glyph?: string;   // ADD
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  dpr?: number;
  zoom?: number;    // ADD (or use scale)
  width?: number;   // ADD
  height?: number;  // ADD
}

export interface WhiteboardEvent {
  type: string;
  payload?: any;    // ADD
  userId?: string;  // ADD
  roomId?: string;  // ADD
}

export interface RemoteCursor {
  userId: string;
  position: { x: number; y: number };  // ADD
  color?: string;
  name?: string;
}
```

#### 1.2 Add Type Guards for Shape Discrimination
```typescript
export function hasPoints(shape: WhiteboardShape): shape is PenAnnotation | HighlighterAnnotation | EraserAnnotation | ShapeObject {
  return 'points' in shape;
}

export function hasGradient(shape: WhiteboardShape): shape is HighlighterAnnotation {
  return shape.type === 'highlighter';
}

export function hasComposite(shape: WhiteboardShape): shape is HighlighterAnnotation {
  return shape.type === 'highlighter';
}
```

---

### Phase 2: Fix Module Imports (Priority 🔴)

#### 2.1 Update react-router-dom Usage
Replace deprecated imports:
- `withRouter` → Use hooks directly
- `useHistory` → `useNavigate`
- `useRouteMatch` → `useMatch`
- `RouterChildContext` → Remove

#### 2.2 Add Vite Type Definitions
Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_BASE_URL?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

### Phase 3: Fix Type Annotations (Priority 🟡)

#### 3.1 Add Explicit Types to Test Files
```typescript
// schemaVerification.ts
export async function verifyTable(
  tableName: string,  // ADD TYPE
  expectedColumns: string[]  // ADD TYPE
): Promise<VerificationResult> {
  // ...
}
```

#### 3.2 Add Null Safety
```typescript
// Before
const width = viewport.width;

// After
const width = viewport?.width ?? 0;
```

---

### Phase 4: Fix Type Assignments (Priority 🟡)

#### 4.1 Fix WhiteboardTool Type Mismatches
Ensure all tool types in `WhiteboardTool` union match usage:
- Add missing tools
- Remove unused tools
- Update cursor map to include all tools

#### 4.2 Fix Shape Type Assignments
Use proper type narrowing:
```typescript
// Before
shape.points = [...]  // Error if shape is TextShape

// After
if (hasPoints(shape)) {
  shape.points = [...]
}
```

---

## Implementation Order

1. ✅ Create `vite-env.d.ts` for import.meta types
2. ✅ Extend whiteboard type definitions
3. ✅ Add type guard functions
4. ✅ Update react-router-dom imports
5. ✅ Add type annotations to test files
6. ✅ Fix null safety issues
7. ✅ Fix type assignments with proper narrowing
8. ✅ Verify zero errors with `npx tsc --noEmit`

---

## Files to Modify

### High Priority
- `src/features/whiteboard/types.ts` - Extend type definitions
- `src/vite-env.d.ts` - Create for Vite types
- `src/features/whiteboard/state/whiteboardCollab.ts` - Fix WhiteboardEvent usage
- `src/features/whiteboard/components/EmojiLayer.tsx` - Fix EmojiObject usage
- `src/features/whiteboard/components/RemoteCursors.tsx` - Fix RemoteCursor usage

### Medium Priority
- `src/test-utils/schemaVerification.ts` - Add type annotations
- `src/test-utils/themeSystemTest.ts` - Add type annotations
- `src/utils/performance.ts` - Add type annotations
- `src/features/whiteboard/hooks/usePointerDrawing.ts` - Fix shape type narrowing
- `src/features/whiteboard/hooks/useWhiteboardTools.ts` - Fix viewport usage

### Low Priority
- Various files with TS2353 (unknown properties) - Add to interfaces or remove

---

**Next Step:** Start with Phase 1 - Fix Type Definitions
