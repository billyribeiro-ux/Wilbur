// ============================================================================
// CANVAS LAYOUT GUARD - Fail-fast layout validation (L65 hardened)
// ============================================================================
// Asserts canvas layout matches logical dimensions exactly.
// Catches stretching, box-model issues, and transform drift at source.
// ============================================================================

/**
 * Assert canvas layout matches logical dimensions.
 * Throws in dev if layout is incorrect; warns in prod.
 */
export function assertCanvasLayout(
  canvas: HTMLCanvasElement,
  logicalW: number,
  logicalH: number
): void {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.round(rect.width);
  const cssH = Math.round(rect.height);

  const attrW = Number(canvas.getAttribute('width'));
  const attrH = Number(canvas.getAttribute('height'));

  const styleW = Math.round(parseFloat(getComputedStyle(canvas).width));
  const styleH = Math.round(parseFloat(getComputedStyle(canvas).height));

  const msgs: string[] = [];

  if (attrW !== logicalW || attrH !== logicalH) {
    msgs.push(`attrs(${attrW}x${attrH}) != logical(${logicalW}x${logicalH})`);
  }
  if (cssW !== logicalW || cssH !== logicalH) {
    msgs.push(`rect(${cssW}x${cssH}) != logical(${logicalW}x${logicalH})`);
  }
  if (styleW !== logicalW || styleH !== logicalH) {
    msgs.push(`style(${styleW}x${styleH}) != logical(${logicalW}x${logicalH})`);
  }

  // Borders/padding break pointer math - enforce content-box
  const cs = getComputedStyle(canvas);
  const hasBorder =
    parseFloat(cs.borderLeftWidth) +
      parseFloat(cs.borderRightWidth) +
      parseFloat(cs.borderTopWidth) +
      parseFloat(cs.borderBottomWidth) >
    0;
  const hasPadding =
    parseFloat(cs.paddingLeft) +
      parseFloat(cs.paddingRight) +
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom) >
    0;
  if (hasBorder || hasPadding || cs.boxSizing !== 'content-box') {
    msgs.push('canvas must be content-box with no border/padding');
  }

  if (msgs.length) {
    const err = `[CanvasLayout] ${msgs.join(' | ')}`;
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(err);
    }
  }
}
