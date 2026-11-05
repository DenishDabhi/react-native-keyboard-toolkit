import {
  calculateKeyboardDisplacement,
  calculateKeyboardOverlap,
  calculateScrollOffset,
} from '../../src/utils/scrollManager';

describe('calculateKeyboardDisplacement', () => {
  it('moves a sticky view only enough to clear the keyboard and spacing', () => {
    expect(calculateKeyboardDisplacement({ y: 750, height: 50 }, 600, 12)).toBe(
      212,
    );
    expect(calculateKeyboardDisplacement({ y: 400, height: 50 }, 600, 12)).toBe(
      0,
    );
  });
});

describe('calculateKeyboardOverlap', () => {
  it('uses the keyboard frame and visible viewport intersection', () => {
    expect(calculateKeyboardOverlap({ y: 20, height: 720 }, 300, 600)).toBe(
      140,
    );
  });

  it('does not count the keyboard again when adjustResize already shortened the view', () => {
    expect(calculateKeyboardOverlap({ y: 0, height: 500 }, 300, 500)).toBe(0);
  });

  it('falls back to the reported height when the keyboard frame is unavailable', () => {
    expect(calculateKeyboardOverlap({ y: 0, height: 800 }, 280)).toBe(280);
  });
});

describe('calculateScrollOffset', () => {
  it('scrolls only the amount needed to clear the keyboard', () => {
    expect(
      calculateScrollOffset(
        { y: 440, height: 50 },
        { y: 0, height: 800 },
        300,
        20,
        10,
      ),
    ).toEqual({ delta: 10, offset: 20 });
  });

  it('does not scroll a field already in the visible area', () => {
    expect(
      calculateScrollOffset(
        { y: 200, height: 40 },
        { y: 0, height: 800 },
        300,
        20,
        50,
      ),
    ).toEqual({ delta: 0, offset: 50 });
  });

  it('uses the measured keyboard top instead of double-counting resize', () => {
    expect(
      calculateScrollOffset(
        { y: 660, height: 40 },
        { y: 0, height: 680 },
        300,
        12,
        0,
        680,
      ),
    ).toEqual({ delta: 32, offset: 32 });
  });

  it('provides enough scroll range to reveal the complete bottom field', () => {
    expect(
      calculateScrollOffset(
        { y: 760, height: 40 },
        { y: 0, height: 800 },
        300,
        16,
        0,
        500,
      ),
    ).toEqual({ delta: 316, offset: 316 });
  });

  it('clamps the scroll offset at zero when an input is above the viewport', () => {
    expect(
      calculateScrollOffset(
        { y: -30, height: 20 },
        { y: 0, height: 700 },
        0,
        10,
        5,
      ),
    ).toEqual({ delta: -40, offset: 0 });
  });
});
