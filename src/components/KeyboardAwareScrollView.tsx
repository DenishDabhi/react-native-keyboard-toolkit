import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native';
import type { ElementRef } from 'react';
import type { KeyboardAwareScrollViewProps } from '../types';
import { getFocusedInput, measureFocusedInput } from '../utils/focusManager';
import {
  calculateKeyboardOverlap,
  calculateScrollOffset,
} from '../utils/scrollManager';
import { useKeyboardDebug } from '../context/KeyboardContext';
import { useKeyboardState } from '../hooks/useKeyboardState';
import { DEFAULT_KEYBOARD_SPACING } from '../utils/constants';
import { isIOS } from '../utils/platform';

/** A ScrollView that adds keyboard space and scrolls a covered focused input into view. */
export function KeyboardAwareScrollView({
  behavior = 'smart',
  keyboardSpacing = DEFAULT_KEYBOARD_SPACING,
  enabled = true,
  contentContainerStyle,
  onScroll,
  onScrollBeginDrag,
  onContentSizeChange,
  onLayout,
  onFocusCapture,
  scrollEventThrottle = 16,
  ...props
}: KeyboardAwareScrollViewProps): React.JSX.Element {
  const keyboard = useKeyboardState();
  const debug = useKeyboardDebug();
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const scrollOffset = useRef(0);
  const lastScrollTarget = useRef<number | null>(null);
  const measurementSequence = useRef(0);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const spacing = Math.max(0, keyboardSpacing);

  const scrollFocusedInput = useCallback(async () => {
    const sequence = ++measurementSequence.current;
    if (!enabled || !keyboard.isVisible || behavior === 'resize') {
      return;
    }

    const scrollView = scrollRef.current;
    const input = getFocusedInput();
    if (!scrollView?.measureInWindow) {
      return;
    }

    const viewport = await new Promise<{ y: number; height: number }>(
      resolve => {
        scrollView.measureInWindow((_x, y, _width, height) =>
          resolve({ y, height }),
        );
      },
    );
    if (sequence !== measurementSequence.current || !keyboard.isVisible) {
      return;
    }

    const overlap = calculateKeyboardOverlap(
      viewport,
      keyboard.height,
      keyboard.screenY,
    );
    if (Math.abs(overlap - keyboardOverlap) > 1) {
      setKeyboardOverlap(overlap);
      return;
    }
    if (
      !input?.measureInWindow ||
      behavior === 'none' ||
      behavior === 'padding'
    ) {
      return;
    }

    const inputLayout = await measureFocusedInput(input);
    if (sequence !== measurementSequence.current || !inputLayout) {
      return;
    }

    const calculation = calculateScrollOffset(
      { y: inputLayout.y, height: inputLayout.height },
      viewport,
      keyboard.height,
      spacing,
      scrollOffset.current,
      keyboard.screenY,
    );

    if (debug && __DEV__) {
      console.debug('[keyboard-shepherd] scroll calculation', calculation);
    }
    if (
      Math.abs(calculation.delta) > 1 &&
      (lastScrollTarget.current === null ||
        Math.abs(lastScrollTarget.current - calculation.offset) > 1)
    ) {
      lastScrollTarget.current = calculation.offset;
      scrollView.scrollTo({ y: calculation.offset, animated: true });
    }
  }, [
    behavior,
    debug,
    enabled,
    keyboard.height,
    keyboard.isVisible,
    keyboard.screenY,
    keyboardOverlap,
    spacing,
  ]);

  useEffect(() => {
    if (!keyboard.isVisible) {
      lastScrollTarget.current = null;
      measurementSequence.current += 1;
      setKeyboardOverlap(0);
      return;
    }
    const frame = requestAnimationFrame(() => {
      scrollFocusedInput();
    });
    return () => cancelAnimationFrame(frame);
  }, [keyboard.height, keyboard.isVisible, scrollFocusedInput]);

  const handleScroll = useCallback(
    (event: Parameters<NonNullable<typeof onScroll>>[0]) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
      if (
        lastScrollTarget.current !== null &&
        Math.abs(scrollOffset.current - lastScrollTarget.current) <= 1
      ) {
        lastScrollTarget.current = null;
      }
      onScroll?.(event);
    },
    [onScroll],
  );

  const handleScrollBeginDrag = useCallback(
    (event: Parameters<NonNullable<typeof onScrollBeginDrag>>[0]) => {
      lastScrollTarget.current = null;
      onScrollBeginDrag?.(event);
    },
    [onScrollBeginDrag],
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      onContentSizeChange?.(width, height);
      if (keyboard.isVisible) {
        requestAnimationFrame(() => scrollFocusedInput());
      }
    },
    [keyboard.isVisible, onContentSizeChange, scrollFocusedInput],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      if (keyboard.isVisible) {
        requestAnimationFrame(() => scrollFocusedInput());
      }
    },
    [keyboard.isVisible, onLayout, scrollFocusedInput],
  );

  const handleFocusCapture = useCallback(
    (event: Parameters<NonNullable<typeof onFocusCapture>>[0]) => {
      onFocusCapture?.(event);
      if (keyboard.isVisible) {
        requestAnimationFrame(() => scrollFocusedInput());
      }
    },
    [keyboard.isVisible, onFocusCapture, scrollFocusedInput],
  );

  const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle);
  const existingBottomPadding =
    typeof flattenedContentStyle?.paddingBottom === 'number'
      ? flattenedContentStyle.paddingBottom
      : 0;
  const shouldPad =
    enabled &&
    keyboard.isVisible &&
    behavior !== 'none' &&
    behavior !== 'resize' &&
    keyboardOverlap > 0;
  const adjustedContentStyle =
    shouldPad && typeof flattenedContentStyle?.paddingBottom !== 'string'
      ? [
          contentContainerStyle,
          {
            paddingBottom: Math.max(
              existingBottomPadding,
              keyboardOverlap + spacing,
            ),
          },
        ]
      : contentContainerStyle;

  return (
    <ScrollView
      {...props}
      automaticallyAdjustKeyboardInsets={
        props.automaticallyAdjustKeyboardInsets ??
        (behavior === 'resize' && isIOS)
      }
      ref={scrollRef}
      contentContainerStyle={adjustedContentStyle}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      onFocusCapture={handleFocusCapture}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      scrollEventThrottle={scrollEventThrottle}
    />
  );
}

export default KeyboardAwareScrollView;
