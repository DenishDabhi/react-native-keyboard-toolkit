import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import type { KeyboardAwareViewProps } from '../types';
import type { KeyboardAwareViewRef } from '../types';
import { DEFAULT_KEYBOARD_SPACING } from '../utils/constants';
import { useKeyboardState } from '../hooks/useKeyboardState';
import { calculateKeyboardOverlap } from '../utils/scrollManager';

/** A lightweight view that adds bottom space while the keyboard is visible. */
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
    const flattenedStyle = StyleSheet.flatten(style);
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
        setKeyboardOverlap(
          calculateKeyboardOverlap(
            { y, height },
            keyboard.height,
            keyboard.screenY,
          ),
        );
      });
    }, [keyboard.height, keyboard.isVisible, keyboard.screenY]);

    useEffect(() => {
      if (!keyboard.isVisible) {
        measurementSequence.current += 1;
        setKeyboardOverlap(0);
        return;
      }
      const frame = requestAnimationFrame(measureOverlap);
      return () => cancelAnimationFrame(frame);
    }, [keyboard.isVisible, keyboard.height, keyboard.screenY, measureOverlap]);

    const handleLayout = useCallback(
      (event: Parameters<NonNullable<typeof onLayout>>[0]) => {
        onLayout?.(event);
        measureOverlap();
      },
      [measureOverlap, onLayout],
    );
    const adjust =
      enabled &&
      keyboard.isVisible &&
      behavior !== 'none' &&
      behavior !== 'resize' &&
      keyboardOverlap > 0 &&
      typeof flattenedStyle?.paddingBottom !== 'string';

    return (
      <View
        {...props}
        ref={viewRef}
        onLayout={handleLayout}
        style={
          adjust
            ? [
                style,
                {
                  paddingBottom: Math.max(
                    basePadding,
                    keyboardOverlap + Math.max(0, keyboardSpacing),
                  ),
                },
              ]
            : style
        }
      />
    );
  },
);

KeyboardAwareView.displayName = 'KeyboardAwareView';

export default KeyboardAwareView;
