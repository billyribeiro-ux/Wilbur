# 🔌 EMOJI TOOL INTEGRATION GUIDE

## Quick Start

### 1. Import CSS
Add to your main CSS file or component:
```typescript
import './features/whiteboard/whiteboard-focus.css';
```

### 2. Wire Emoji Tool in Canvas
```typescript
// In WhiteboardCanvas.tsx or similar
import { 
  activateEmojiTool, 
  deactivateEmojiTool,
  handleEmojiPointerDown,
  handleEmojiPointerMove,
  handleEmojiPointerUp,
  handleEmojiKeyDown 
} from './tools/EmojiTool';
import { EmojiLayer } from './components/EmojiLayer';
import { EmojiPicker } from './ui/EmojiPicker';

// In your canvas component:
const tool = useWhiteboardStore((s) => s.tool);

// Activate/deactivate based on tool
useEffect(() => {
  if (tool === 'stamp') {
    activateEmojiTool();
  } else {
    deactivateEmojiTool();
  }
}, [tool]);

// Add pointer handlers
const onPointerDown = (e: React.PointerEvent) => {
  if (tool === 'stamp') {
    const handled = handleEmojiPointerDown(
      e.nativeEvent,
      canvasRef.current!,
      viewport
    );
    if (handled) return;
  }
  // ... other tool handlers
};

// Add keyboard handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (tool === 'stamp') {
      const handled = handleEmojiKeyDown(e);
      if (handled) return;
    }
    // ... other shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [tool]);

// Render emoji layer
<EmojiLayer viewport={viewport} width={width} height={height} />
```

### 3. Add Emoji Picker Trigger
```typescript
// Show picker when stamp tool is clicked
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

const handleCanvasClick = (e: React.MouseEvent) => {
  if (tool === 'stamp') {
    setPickerPosition({ x: e.clientX, y: e.clientY });
    setShowEmojiPicker(true);
  }
};

{showEmojiPicker && (
  <EmojiPicker
    position={pickerPosition}
    onSelect={(emoji) => {
      insertEmoji(emoji, pickerPosition);
      setShowEmojiPicker(false);
    }}
    onClose={() => setShowEmojiPicker(false)}
  />
)}
```

### 4. Recording Integration
```typescript
// In your recording setup
import { attachOverlay, detachOverlay, compositeAnnotations } from './recording/overlayBridge';

// When starting recording
const overlayCanvas = attachOverlay(mainCanvas, {
  includeEmojis: true,
  includeShapes: true,
  includeText: true,
  excludeToolbar: true,
});

// In render loop
const shapes = useWhiteboardStore((s) => s.shapes);
const emojis = useWhiteboardStore((s) => s.emojis);
compositeAnnotations(shapes, emojis, viewport);

// When stopping recording
detachOverlay();
```

## Feature Flags

Enable debugging or optional features:
```typescript
// In your settings or dev tools
useWhiteboardStore.setState({
  emojiDebug: true,          // Console logs
  emojiSnapToGrid: true,     // Snap to 8px grid
  emojiUseTwemoji: false,    // Twemoji fallback (future)
});
```

## Keyboard Shortcuts

Already wired in `EmojiTool.ts`:
- **Delete / Backspace**: Delete selected emoji
- **Arrow Keys**: Nudge 1px
- **Shift + Arrow Keys**: Nudge 10px
- **Shift + Drag Resize**: Snap to 0.25 increments
- **Shift + Rotate**: Snap to 15° increments

## Testing

Run tests:
```bash
npm test emoji
```

Or specific suite:
```bash
npm test emoji.insert.spec.ts
npm test emoji.transform.spec.ts
npm test emoji.delete.spec.ts
npm test emoji.pointer.spec.ts
npm test emoji.recording.spec.ts
```

## Troubleshooting

### Emojis not appearing
- Check `tool === 'stamp'` is active
- Verify `EmojiLayer` is rendered
- Check `emojis` Map in store

### Selection not working
- Ensure `activateEmojiTool()` is called
- Check pointer handlers are wired
- Verify hit-testing with `emojiDebug: true`

### Recording missing emojis
- Confirm `attachOverlay()` is called
- Check `compositeAnnotations()` in render loop
- Verify `includeEmojis: true` in config

### Focus rings showing on click
- Verify `whiteboard-focus.css` is imported
- Check `:focus-visible` polyfill if needed
- Ensure no custom focus styles override

## Performance

- Emojis render on separate canvas layer (no reflow)
- DPR-aware for HiDPI displays
- History batching prevents memory bloat
- Cleanup on unmount prevents leaks

## Accessibility

- Keyboard navigation in picker (Arrow keys, Enter, Esc)
- Focus visible only on keyboard nav (`:focus-visible`)
- WCAG AA compliant
- Screen reader friendly (ARIA labels)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (Apple Color Emoji)
- Mobile Safari: ✅ Touch events via pointer
- Android Chrome: ✅ Touch events via pointer

## Next Steps

1. Import CSS
2. Wire tool activation
3. Add pointer/keyboard handlers
4. Render EmojiLayer
5. Add picker trigger
6. Test locally
7. Deploy

**Done!** 🎉
