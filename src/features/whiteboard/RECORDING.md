# Whiteboard Recording & Presenter Modes

## Overview

The whiteboard system now supports two presenter modes and optional ink compositing for recordings.

## Presenter Modes

### 1. Transparent Mode (Default)
- Ink overlay appears **over** screen share
- Best for annotating shared content
- Ink is client-side only by default
- Recording captures screen share without ink (unless "Record Ink in Output" is enabled)

### 2. Whiteboard Mode
- Clean canvas with solid background
- No screen share required
- Best for drawing/teaching without screen content
- Recording captures whiteboard + ink

## Recording Settings

### Record Ink in Output Toggle
**Location:** Whiteboard Toolbar → "Record Ink in Output" checkbox

**Behavior:**
- **OFF (default):** Recording captures raw screen share only. Ink overlay remains client-side.
- **ON:** Recording captures composited stream (screen + ink). Ink appears in the recording.

## How It Works

### Without Ink Recording (recordInkInOutput = false)
```
Screen Share Track → Recording
Ink Overlay → Client-side only (not recorded)
```

### With Ink Recording (recordInkInOutput = true)
```
Screen Share Track ──┐
                     ├→ CompositorService → Composited Track → Recording
Ink Overlay ─────────┘
```

## CompositorService

### Purpose
Composites whiteboard ink overlay with screen share for recording output.

### API
```typescript
interface StartParams {
  displayTrack: MediaStreamTrack | null;
  overlayCanvas: HTMLCanvasElement | OffscreenCanvas;
  mode: 'transparent' | 'whiteboard';
  bg?: string | null;
  fps?: number;
}

class CompositorService {
  start(params: StartParams): MediaStream;
  swapMode(mode: 'transparent'|'whiteboard', bg?: string|null): void;
  stop(): void;
  getStream(): MediaStream | null;
}
```

### Usage
```typescript
import { getCompositorService } from '@/services/CompositorService';

const compositor = getCompositorService();

// Start compositing
const compositedStream = compositor.start({
  displayTrack: screenShareTrack,
  overlayCanvas: whiteboardCanvas,
  mode: 'transparent',
  fps: 30
});

// Use composited stream for recording
recorder.start(compositedStream);

// Switch mode during recording
compositor.swapMode('whiteboard', '#0b0f19');

// Stop when done
compositor.stop();
```

## Integration with Existing Recording

### No New UI
The feature reuses your existing recording button/controls. No new record UI is added.

### Recording Flow

#### 1. User Clicks Existing Record Button
```typescript
// In your existing recording handler:
const mode = useWhiteboardStore.getState().mode;
const recordInkInOutput = useWhiteboardStore.getState().recordInkInOutput;

if (recordInkInOutput) {
  // Start compositor
  const compositor = getCompositorService();
  const compositedStream = compositor.start({
    displayTrack: currentScreenShareTrack,
    overlayCanvas: whiteboardCanvasElement,
    mode,
    fps: 30
  });
  
  // Use composited stream for recording
  startRecording(compositedStream);
} else {
  // Use raw screen share (current behavior)
  startRecording(currentScreenShareTrack);
}
```

#### 2. User Stops Recording
```typescript
// In your existing stop handler:
stopRecording();

if (compositorWasUsed) {
  const compositor = getCompositorService();
  compositor.stop();
}
```

### Hot-Swapping During Recording

#### Toggle recordInkInOutput While Recording
```typescript
// Watch for toggle changes
useEffect(() => {
  if (isRecording) {
    if (recordInkInOutput) {
      // Start compositor and swap track
      const compositor = getCompositorService();
      const compositedStream = compositor.start({...});
      replaceRecordingTrack(compositedStream.getVideoTracks()[0]);
    } else {
      // Stop compositor and swap back to raw
      const compositor = getCompositorService();
      compositor.stop();
      replaceRecordingTrack(rawScreenShareTrack);
    }
  }
}, [recordInkInOutput, isRecording]);
```

#### Switch Mode While Recording
```typescript
// Watch for mode changes
useEffect(() => {
  if (isRecording && recordInkInOutput) {
    const compositor = getCompositorService();
    compositor.swapMode(mode, background);
  }
}, [mode, isRecording, recordInkInOutput]);
```

## Edge Cases

### 1. No Screen Share + Whiteboard Mode + Recording
**Behavior:** Compositor creates stream with solid background + ink overlay.
```typescript
compositor.start({
  displayTrack: null,  // No screen share
  overlayCanvas: whiteboardCanvas,
  mode: 'whiteboard',
  bg: '#0b0f19'
});
```

### 2. Switching Mode During Recording
**Behavior:** Compositor updates rendering without restarting recording.
```typescript
// Seamless transition
compositor.swapMode('whiteboard', '#0b0f19');
```

### 3. Toggle Recording During Active Session
**Behavior:** Track swap without disconnecting room.
```typescript
// Use replaceTrack API
sender.replaceTrack(newTrack);
```

## Performance

### Target Metrics
- **FPS:** 30 (configurable)
- **Resolution:** 1920x1080 (matches screen share)
- **CPU:** Throttled RAF loop to maintain headroom

### Optimization
- Uses `OffscreenCanvas` where available
- Throttles render loop to target FPS
- Cleans up all resources on stop

## Store State

### Whiteboard Store Extension
```typescript
{
  mode: 'transparent' | 'whiteboard',  // Default: 'transparent'
  recordInkInOutput: boolean,          // Default: false
  background: string | null            // Default: null
}
```

### Actions
```typescript
setMode(mode: 'transparent' | 'whiteboard'): void
setRecordInkInOutput(enabled: boolean): void
setBackground(background: string | null): void
```

## UI Components

### Mode Selector (Toolbar)
- Segmented control: Transparent | Whiteboard
- Located in whiteboard toolbar
- No layout changes to existing UI

### Record Ink Toggle (Toolbar)
- Checkbox: "Record Ink in Output"
- Helper text: "When enabled, recordings will include ink overlay"
- No new record button

## Testing

### Manual Testing
1. **Transparent + No Ink Recording**
   - Start screen share
   - Draw with pen
   - Start recording
   - Verify: Recording shows screen only, no ink

2. **Transparent + Ink Recording**
   - Start screen share
   - Draw with pen
   - Enable "Record Ink in Output"
   - Start recording
   - Verify: Recording shows screen + ink

3. **Whiteboard + Ink Recording**
   - Don't start screen share
   - Switch to Whiteboard mode
   - Draw with pen
   - Enable "Record Ink in Output"
   - Start recording
   - Verify: Recording shows clean board + ink

4. **Mode Switch During Recording**
   - Start recording with ink enabled
   - Switch from Transparent to Whiteboard
   - Verify: Recording updates without glitch

5. **Toggle During Recording**
   - Start recording without ink
   - Enable "Record Ink in Output"
   - Verify: Recording starts showing ink
   - Disable toggle
   - Verify: Recording stops showing ink

### Automated Testing
```typescript
describe('CompositorService', () => {
  it('composites screen + ink in transparent mode');
  it('composites background + ink in whiteboard mode');
  it('swaps mode without restarting');
  it('cleans up all resources on stop');
});
```

## Troubleshooting

### Ink Not Appearing in Recording
- Check "Record Ink in Output" is enabled
- Verify compositor is started before recording
- Check browser console for errors

### Performance Issues
- Lower FPS (try 15 or 24)
- Reduce canvas resolution
- Check CPU usage in DevTools

### Track Swap Not Working
- Ensure using `replaceTrack` API
- Verify track is active before swap
- Check browser compatibility

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Limited OffscreenCanvas support (falls back to regular canvas)

## Future Enhancements

- Custom background colors/images
- Multiple overlay layers
- GPU-accelerated compositing
- WebCodecs API integration
