# Retired Files

## Files Moved to `/src/retired_files/whiteboard/`

### 1. `WhiteboardOverlay.tsx.old`
**Original Location:** `/src/components/trading/WhiteboardOverlay.tsx`  
**Size:** 1,191 lines  
**Reason for Retirement:**
- Monolithic file violated Single Responsibility Principle
- No separation of concerns (canvas, toolbar, state all mixed)
- No Zustand store integration
- Missing pan/zoom viewport transforms
- No proper collaboration system
- No accessibility features
- Difficult to maintain and extend

**Replaced By:**
- `/src/features/whiteboard/WhiteboardOverlay.tsx` (slim container)
- `/src/features/whiteboard/components/WhiteboardCanvas.tsx` (rendering)
- `/src/features/whiteboard/components/WhiteboardToolbar.tsx` (UI)
- `/src/features/whiteboard/state/whiteboardStore.ts` (state)
- `/src/features/whiteboard/utils/*` (utilities)

### 2. `whiteboardTypes.ts.old`
**Original Location:** `/src/components/trading/whiteboardTypes.ts`  
**Size:** 132 lines  
**Reason for Retirement:**
- Merged into new comprehensive type system
- Missing viewport/transform types
- Missing remote cursor types
- Missing export option types

**Replaced By:**
- `/src/features/whiteboard/types.ts` (enhanced with new types)

### 3. `whiteboardTest.tsx.old`
**Original Location:** `/src/components/trading/whiteboardTest.tsx`  
**Size:** 68 lines  
**Reason for Retirement:**
- Unclear purpose
- Will be replaced with proper unit/component/E2E tests in Phase 5

**Replaced By:**
- `/tests/whiteboard/unit/*` (future)
- `/tests/whiteboard/component/*` (future)
- `/tests/whiteboard/e2e/*` (future)

## Migration Guide

### Old Import
```typescript
import { WhiteboardOverlay } from './WhiteboardOverlay';
```

### New Import
```typescript
import { WhiteboardOverlay } from '../../features/whiteboard/WhiteboardOverlay';
```

### Props Compatibility
The new `WhiteboardOverlay` maintains the same prop interface for backward compatibility:
- ✅ `isActive`
- ✅ `canAnnotate`
- ✅ `width`
- ✅ `height`
- ✅ `roomId`
- ✅ `userId`
- ✅ `onClose`
- ✅ `onEventEmit` (Phase 3)
- ✅ `incomingEvents` (Phase 3)

## Do Not Delete

These retired files are kept for reference and potential data migration. They may be deleted after:
1. Full Phase 5 completion
2. 30 days of production use with no issues
3. Explicit approval from team lead

## Questions?

See `/src/features/whiteboard/README.md` for architecture documentation.
