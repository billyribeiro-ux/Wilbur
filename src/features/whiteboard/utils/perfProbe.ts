// ============================================================================
// PERFORMANCE PROBE - Budget Enforcement
// ============================================================================
// Measure FPS, latency, undo time, and memory
// ============================================================================

/**
 * Measure average FPS during callback execution
 */
export async function measureFPS(
  cb: () => void | Promise<void>,
  durationMs = 5000
): Promise<{ avg: number; samples: number }> {
  const frames: number[] = [];
  let lastTime = performance.now();
  let running = true;
  
  const measureFrame = () => {
    if (!running) return;
    
    const now = performance.now();
    const delta = now - lastTime;
    if (delta > 0) {
      frames.push(1000 / delta);
    }
    lastTime = now;
    
    requestAnimationFrame(measureFrame);
  };
  
  requestAnimationFrame(measureFrame);
  
  const startTime = performance.now();
  await Promise.resolve(cb());
  
  await new Promise((resolve) => {
    setTimeout(() => {
      running = false;
      resolve(undefined);
    }, durationMs - (performance.now() - startTime));
  });
  
  const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
  return { avg, samples: frames.length };
}

/**
 * Measure input latency (pointer to paint)
 */
export async function measureInputLatency(
  samples: number[]
): Promise<{ median: number }> {
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  return { median };
}

/**
 * Measure undo operation time
 */
export async function measureUndoTime(
  undoFn: () => void,
  iterations = 50
): Promise<{ median: number }> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    undoFn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const sorted = times.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  return { median };
}

/**
 * Measure memory usage
 */
export async function measureMemory(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  // @ts-expect-error - performance.memory is non-standard
  if (performance.memory) {
    // @ts-expect-error - performance.memory is non-standard
    return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
  }
  
  // Fallback: estimate based on object count
  return 0;
}

/**
 * Performance budgets (configurable via env)
 */
export const PERF_BUDGETS = {
  FPS_MIN: Number(process.env.WB_FPS_MIN) || 55,
  LATENCY_MS_MAX: Number(process.env.WB_LATENCY_MS_MAX) || 16,
  UNDO_MS_MAX: Number(process.env.WB_UNDO_MS_MAX) || 10,
  MEM_MB_MAX: Number(process.env.WB_MEM_MB_MAX) || 120,
};
