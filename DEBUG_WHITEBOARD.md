# Whiteboard Canvas Not Loading - Debug Guide

## Issue
Whiteboard canvas is not loading/displaying when activated.

## Architecture Verification ✅

### Components Present
- ✅ WhiteboardOverlay.tsx (main container)
- ✅ WhiteboardCanvas.tsx (canvas with DPR)
- ✅ WhiteboardToolbar.tsx (Zoom-like toolbar)
- ✅ WhiteboardSurface.tsx (container)

### Integration Points
- ✅ TradingRoomLayout renders WhiteboardOverlay
- ✅ Props passed correctly (isActive, width, height, etc.)
- ✅ State management via useTradingRoomState
- ✅ Handlers: onWhiteboardOpen, onWhiteboardClose

### Rendering Logic
- ✅ WhiteboardOverlay checks `if (!isActive) return null`
- ✅ Canvas element rendered with proper attributes
- ✅ DPR setup via setupCanvasDPR in useEffect
- ✅ redrawCanvas function exists
- ✅ useEffect calls redrawCanvas when shapes change

## Potential Issues to Check

### 1. **Permission Issue** ⚠️
**Symptom**: Whiteboard button not visible
**Cause**: Button is admin-only (`canManageRoom`)
**Location**: `src/components/icons/BrandHeader.tsx:688`
**Check**:
```typescript
// Line 688-694
{canManageRoom && (
  <button onClick={onToggleWhiteboard}>
    Whiteboard
  </button>
)}
```
**Solution**: Verify user has admin role or adjust permissions

### 2. **Canvas Not Visible** ⚠️
**Symptom**: Canvas renders but nothing shows
**Possible Causes**:
- Width/height are 0
- Canvas is behind other elements (z-index)
- DPR setup failing silently
- No shapes to render

**Debug Steps**:
1. Open browser DevTools
2. Inspect element - look for `<canvas data-testid="whiteboard-canvas">`
3. Check computed styles:
   - `width` should be > 0
   - `height` should be > 0
   - `z-index` should be 50
   - `position` should be absolute

### 3. **State Not Updating** ⚠️
**Symptom**: Clicking whiteboard button does nothing
**Check**:
```javascript
// In browser console:
// 1. Check if state updates
console.log('Whiteboard Active:', document.querySelector('[data-testid="whiteboard-canvas"]'));

// 2. Check props
// React DevTools > TradingRoomLayout > WhiteboardOverlay
// Verify: isActive = true
```

### 4. **Canvas Context Failing** ⚠️
**Symptom**: Canvas renders but DPR setup fails
**Check browser console for**:
```
[Whiteboard] Canvas initialization error: ...
```

### 5. **Shapes Not Rendering** ⚠️
**Symptom**: Canvas is there but blank
**Possible Causes**:
- No shapes in store
- drawShape function error
- Context not set

**Debug**:
```javascript
// In browser console with React DevTools
// Check Zustand store
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).getCurrentFiber()
```

## Quick Diagnostic Checklist

Run these checks in order:

### Browser Check
1. [ ] Open application in browser
2. [ ] Open DevTools (F12)
3. [ ] Check Console for errors
4. [ ] Check Network tab for failed requests

### User Role Check
1. [ ] Verify user is admin (canManageRoom = true)
2. [ ] Check if whiteboard button is visible in header
3. [ ] If not visible, check Toolbar.tsx for alternative button

### Canvas Element Check
1. [ ] Click whiteboard button
2. [ ] Inspect page for `<canvas data-testid="whiteboard-canvas">`
3. [ ] Check canvas computed styles (width, height, z-index)
4. [ ] Verify canvas is not `display: none`

### State Check (React DevTools)
1. [ ] Install React DevTools extension
2. [ ] Find TradingRoomLayout component
3. [ ] Check props: `isWhiteboardActive` should be `true`
4. [ ] Find WhiteboardOverlay component
5. [ ] Check props: `isActive` should be `true`

### Store Check
1. [ ] Find WhiteboardStore in React DevTools
2. [ ] Check `shapes` - should be a Map
3. [ ] Check `tool` - should have a value
4. [ ] Try drawing - check if shapes are added

## Expected Behavior

When working correctly:
1. User clicks whiteboard button (admin only)
2. `isWhiteboardActive` becomes `true`
3. WhiteboardOverlay renders
4. Canvas element appears with proper dimensions
5. WhiteboardToolbar appears (draggable toolbar)
6. User can select tools and draw
7. Shapes appear on canvas

## Console Commands for Debugging

```javascript
// Check if canvas exists
document.querySelector('[data-testid="whiteboard-canvas"]')

// Check canvas dimensions
const canvas = document.querySelector('[data-testid="whiteboard-canvas"]');
console.log('Canvas:', canvas);
console.log('Width:', canvas?.width, 'Height:', canvas?.height);
console.log('Style:', canvas?.style.width, canvas?.style.height);

// Check if whiteboard is active
const overlay = document.querySelector('.absolute.inset-0.z-50');
console.log('Overlay:', overlay);

// Check toolbar
const toolbar = document.querySelector('[data-testid="whiteboard-toolbar"]');
console.log('Toolbar:', toolbar);
```

## Most Likely Issues

Based on the code review:

### Issue #1: User Not Admin ⭐⭐⭐⭐⭐
**Probability**: 90%
**Fix**: Make user admin or adjust `canManageRoom` logic

### Issue #2: Canvas Dimensions Zero ⭐⭐⭐
**Probability**: 60%
**Fix**: Check `state.size?.w` and `state.size?.h` in TradingRoomLayout

### Issue #3: Z-index Conflict ⭐⭐
**Probability**: 30%
**Fix**: Verify no other elements have z-index > 50

### Issue #4: DPR Setup Error ⭐
**Probability**: 10%
**Fix**: Check console for setupCanvasDPR errors

## Next Steps

1. **Verify user role** - Most likely issue
2. **Check browser console** - Look for errors
3. **Inspect canvas element** - Verify it exists and has dimensions
4. **Test with admin user** - Confirm permissions
5. **Check React DevTools** - Verify state propagation

## Files to Review

If issue persists:
- `src/components/icons/BrandHeader.tsx` (line 688) - Permission check
- `src/components/trading/TradingRoomLayout.tsx` (line 368) - WhiteboardOverlay integration
- `src/features/whiteboard/WhiteboardOverlay.tsx` (line 880) - isActive check
- `src/components/trading/useTradingRoomState.ts` (line 201) - State management

## Contact

If none of these steps resolve the issue, provide:
1. Browser console errors
2. Screenshot of React DevTools showing WhiteboardOverlay props
3. User role/permissions
4. Canvas element inspection screenshot
