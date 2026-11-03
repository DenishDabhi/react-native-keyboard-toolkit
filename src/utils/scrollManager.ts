export interface ScrollViewport {
  y: number;
  height: number;
}

export interface ScrollInput {
  y: number;
  height: number;
}

export interface ScrollCalculation {
  offset: number;
  delta: number;
}

/** Return the part of the measured view actually covered by the keyboard. */
export function calculateKeyboardOverlap(
  viewport: ScrollViewport,
  keyboardHeight: number,
  keyboardTop?: number,
): number {
  const viewportBottom = viewport.y + viewport.height;
  const obscuredTop =
    typeof keyboardTop === 'number'
      ? Math.max(viewport.y, Math.min(viewportBottom, keyboardTop))
      : Math.max(viewport.y, viewportBottom - Math.max(0, keyboardHeight));

  return Math.max(0, viewportBottom - obscuredTop);
}

/**
 * Calculate the smallest scroll adjustment needed to bring an input into the
 * visible viewport. `keyboardTop` avoids double-counting Android adjustResize.
 */
export function calculateScrollOffset(
  input: ScrollInput,
  viewport: ScrollViewport,
  keyboardHeight: number,
  spacing: number,
  currentOffset: number,
  keyboardTop?: number,
): ScrollCalculation {
  const viewportBottom = viewport.y + viewport.height;
  const unobscuredBottom =
    viewportBottom -
    calculateKeyboardOverlap(viewport, keyboardHeight, keyboardTop) -
    spacing;
  const unobscuredTop = viewport.y + spacing;
  const inputBottom = input.y + input.height;

  let delta = 0;
  if (inputBottom > unobscuredBottom) {
    delta = inputBottom - unobscuredBottom;
  } else if (input.y < unobscuredTop) {
    delta = input.y - unobscuredTop;
  }

  return { delta, offset: Math.max(0, currentOffset + delta) };
}
