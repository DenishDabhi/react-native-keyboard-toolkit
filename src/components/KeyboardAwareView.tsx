import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { KeyboardAwareViewProps } from '../types';
import type { KeyboardAwareViewRef } from '../types';
import { DEFAULT_KEYBOARD_SPACING } from '../utils/constants';
import { useKeyboardState } from '../hooks/useKeyboardState';
import {
  calculateKeyboardDisplacement,
  calculateKeyboardOverlap,
} from '../utils/scrollManager';

/** Adds keyboard spacing to in-flow content and keeps absolute footers visible. */
export const KeyboardAwareView: React.ForwardRefExoticComponent<
  KeyboardAwareViewProps & React.RefAttributes<KeyboardAwareViewRef>
> = forwardRef<KeyboardAwareViewRef, KeyboardAwareViewProps>(
  function KeyboardAwareViewComponent(
    {
      behavior = 'smart',
      keyboardSpacing = DEFAULT_KEYBOARD_SPACING,
      enabled = true,
      style,
      onLayout,
      ...props
    },
    forwardedRef,
  ): React.JSX.Element {
    const keyboard = useKeyboardState();
    const viewRef = useRef<KeyboardAwareViewRef>(null);
    useImperativeHandle(forwardedRef, () => viewRef.current!, []);
    const measurementSequence = useRef(0);
    const [keyboardOverlap, setKeyboardOverlap] = useState(0);
    const [keyboardDisplacement, setKeyboardDisplacement] = useState(0);
    const animatedDisplacement = useRef(new Animated.Value(0)).current;
    const flattenedStyle = StyleSheet.flatten(style);
    const isAbsolutelyPositioned = flattenedStyle?.position === 'absolute';
    const spacing = Number.isFinite(keyboardSpacing)
      ? Math.max(0, keyboardSpacing)
      : 0;
    const basePadding =
      typeof flattenedStyle?.paddingBottom === 'number'
        ? flattenedStyle.paddingBottom
        : 0;
    const measureOverlap = useCallback(() => {
      const view = viewRef.current;
      if (!view?.measureInWindow || !keyboard.isVisible) {
        return;
      }

      const sequence = ++measurementSequence.current;
      view.measureInWindow((_x, y, _width, height) => {
        if (sequence !== measurementSequence.current || !keyboard.isVisible) {
          return;
        }
        if (!isAbsolutelyPositioned) {
          setKeyboardOverlap(
            calculateKeyboardOverlap(
              { y, height },
              keyboard.height,
              keyboard.screenY,
            ),
          );
        }
        setKeyboardDisplacement(
          isAbsolutelyPositioned && typeof keyboard.screenY === 'number'
            ? calculateKeyboardDisplacement(
                { y, height },
                keyboard.screenY,
                spacing,
              )
            : 0,
        );
      });
    }, [
      isAbsolutelyPositioned,
      keyboard.height,
      keyboard.isVisible,
      keyboard.screenY,
      spacing,
    ]);

    useEffect(() => {
      if (!keyboard.isVisible) {
        measurementSequence.current += 1;
        setKeyboardOverlap(0);
        setKeyboardDisplacement(0);
        return;
      }
      const frame = requestAnimationFrame(measureOverlap);
      return () => cancelAnimationFrame(frame);
    }, [keyboard.isVisible, keyboard.height, keyboard.screenY, measureOverlap]);

    const shouldAdjust =
      enabled &&
      keyboard.isVisible &&
      behavior !== 'none' &&
      behavior !== 'resize';
    useEffect(() => {
      if (!isAbsolutelyPositioned) {
        animatedDisplacement.setValue(0);
        return;
      }
      const animation = Animated.timing(animatedDisplacement, {
        toValue: shouldAdjust ? -keyboardDisplacement : 0,
        duration: keyboard.animationDuration,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [
      animatedDisplacement,
      isAbsolutelyPositioned,
      keyboard.animationDuration,
      keyboardDisplacement,
      shouldAdjust,
    ]);

    const handleLayout = useCallback(
      (event: Parameters<NonNullable<typeof onLayout>>[0]) => {
        onLayout?.(event);
        measureOverlap();
      },
      [measureOverlap, onLayout],
    );
    const adjustPadding =
      shouldAdjust &&
      !isAbsolutelyPositioned &&
      keyboardOverlap > 0 &&
      typeof flattenedStyle?.paddingBottom !== 'string';
    const stickyTransform = isAbsolutelyPositioned
      ? [
          ...(Array.isArray(flattenedStyle?.transform)
            ? flattenedStyle.transform
            : []),
          { translateY: animatedDisplacement },
        ]
      : undefined;

    return (
      <Animated.View
        {...props}
        ref={viewRef}
        onLayout={handleLayout}
        style={
          adjustPadding
            ? [
                style,
                {
                  paddingBottom: Math.max(
                    basePadding,
                    keyboardOverlap + spacing,
                  ),
                },
              ]
            : isAbsolutelyPositioned
            ? [style, { transform: stickyTransform }]
            : style
        }
      />
    );
  },
);

KeyboardAwareView.displayName = 'KeyboardAwareView';

export default KeyboardAwareView;
