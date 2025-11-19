# Highlighter Performance Test - Evidence Collection

## Test Instructions

1. **Open the browser with console** (F12 or Cmd+Option+I)
2. **Clear the console** (Cmd+K or click clear button)
3. **Select the highlighter tool**
4. **Draw a SHORT stroke** (about 1 second, ~10-20 mouse moves)
5. **Stop and examine the console output**

## What to Look For

### ✅ CORRECT Behavior (Evidence of Fix):

```
🔵 [MOUSE MOVE] Adding point {tool: 'highlighter', x: 100, y: 100, currentLength: 0}
🟢 [RAF DRAW] Executing {tool: 'highlighter', pathLength: 2, lastDrawnIndex: 0, newPoints: 1}
✅ [RAF DRAW] Complete {drewSegments: 1, newLastIndex: 1}

🔵 [MOUSE MOVE] Adding point {tool: 'highlighter', x: 101, y: 101, currentLength: 1}
🟢 [RAF DRAW] Executing {tool: 'highlighter', pathLength: 3, lastDrawnIndex: 1, newPoints: 1}
✅ [RAF DRAW] Complete {drewSegments: 1, newLastIndex: 2}
```

**Pattern**: 
- Each mouse move → ONE RAF draw
- No 🔴 MAIN RENDER during drawing
- newPoints: 1 (only drawing NEW segments)

### ❌ INCORRECT Behavior (Evidence of Problem):

```
🔵 [MOUSE MOVE] Adding point
🔴 [MAIN RENDER] Triggered {isDrawing: true}  ← BAD! Should not happen during drawing
```

OR

```
🔵 [MOUSE MOVE] Adding point
🟢 [RAF DRAW] Executing {newPoints: 10}  ← BAD! Should be 1, not 10
```

OR

```
🔵 [MOUSE MOVE] Adding point
(no RAF DRAW logs)  ← BAD! RAF not executing
```

## Evidence to Collect

1. **Count the logs**:
   - Number of 🔵 MOUSE MOVE logs = number of mouse events
   - Number of 🟢 RAF DRAW logs = number of actual draws
   - Number of 🔴 MAIN RENDER logs during drawing = should be ZERO

2. **Check RAF execution**:
   - Is RAF executing for each point?
   - Is it drawing only NEW segments (newPoints: 1)?
   - Is lastDrawnIndex incrementing correctly?

3. **Check for full redraws**:
   - Are there any 🔴 MAIN RENDER logs while isDrawing: true?
   - If yes, the main render is incorrectly triggering

## Performance Metrics

Good performance:
- 10 mouse moves → 10 RAF draws → 0 main renders
- Each RAF draws 1 segment
- Total canvas operations: 10

Bad performance:
- 10 mouse moves → 20+ RAF draws (double rendering)
- OR: 10 mouse moves → 10 main renders (full redraws)
- Total canvas operations: 100+

## After Testing

**Copy the ENTIRE console output** and send it back for analysis.
