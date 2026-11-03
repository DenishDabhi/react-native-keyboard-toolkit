import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { KeyboardToolbarProps } from '../types';
import { useKeyboardState } from '../hooks/useKeyboardState';

function findFocusedInputIndex(
  inputRefs: NonNullable<KeyboardToolbarProps['inputRefs']>,
): number {
  return inputRefs.findIndex(ref => ref.current?.isFocused() === true);
}

function isMountedInputAt(
  inputRefs: NonNullable<KeyboardToolbarProps['inputRefs']>,
  index: number,
): boolean {
  return (
    index >= 0 && index < inputRefs.length && inputRefs[index]?.current != null
  );
}

function hasMountedInputBefore(
  inputRefs: NonNullable<KeyboardToolbarProps['inputRefs']>,
  index: number,
): boolean {
  return inputRefs.some(
    (input, inputIndex) => inputIndex < index && input.current != null,
  );
}

function hasMountedInputAfter(
  inputRefs: NonNullable<KeyboardToolbarProps['inputRefs']>,
  index: number,
): boolean {
  return inputRefs.some(
    (input, inputIndex) => inputIndex > index && input.current != null,
  );
}

/** An optional in-layout toolbar for input navigation and keyboard dismissal. */
export function KeyboardToolbar({
  inputRefs = [],
  focusedInputIndex,
  onFocusedInputChange,
  onDone,
  doneText = 'Done',
  children,
  alwaysVisible = false,
  style,
  ...props
}: KeyboardToolbarProps): React.JSX.Element | null {
  const keyboard = useKeyboardState();
  const [trackedIndex, setTrackedIndex] = useState(-1);
  const lastReportedIndex = useRef(-1);
  const trackFocus = useCallback(() => {
    const index = findFocusedInputIndex(inputRefs);
    setTrackedIndex(current => (current === index ? current : index));
    if (lastReportedIndex.current !== index) {
      lastReportedIndex.current = index;
      onFocusedInputChange?.(index);
    }
  }, [inputRefs, onFocusedInputChange]);

  useEffect(() => {
    trackFocus();
    if (!keyboard.isVisible && !alwaysVisible) {
      return;
    }

    const interval = setInterval(trackFocus, 100);
    return () => clearInterval(interval);
  }, [alwaysVisible, keyboard.isVisible, trackFocus]);

  if (!alwaysVisible && !keyboard.isVisible) {
    return null;
  }

  const actualFocusedIndex = findFocusedInputIndex(inputRefs);
  const currentIndex =
    actualFocusedIndex >= 0
      ? actualFocusedIndex
      : isMountedInputAt(inputRefs, trackedIndex)
      ? trackedIndex
      : isMountedInputAt(inputRefs, focusedInputIndex ?? -1)
      ? focusedInputIndex!
      : -1;
  const canNavigateBackward =
    currentIndex >= 0 && hasMountedInputBefore(inputRefs, currentIndex);
  const canNavigateForward =
    currentIndex >= 0 && hasMountedInputAfter(inputRefs, currentIndex);

  const focusInDirection = (direction: -1 | 1) => {
    const actualIndex = findFocusedInputIndex(inputRefs);
    const origin = actualIndex >= 0 ? actualIndex : currentIndex;
    if (origin < 0) {
      return;
    }

    for (
      let index = origin + direction;
      index >= 0 && index < inputRefs.length;
      index += direction
    ) {
      const target = inputRefs[index]?.current;
      if (target) {
        target.focus();
        lastReportedIndex.current = index;
        setTrackedIndex(index);
        onFocusedInputChange?.(index);
        return;
      }
    }
  };

  const done = () => {
    const focusedInput = TextInput.State.currentlyFocusedInput?.();
    if (focusedInput) {
      TextInput.State.blurTextInput(focusedInput);
    }
    Keyboard.dismiss();
    onDone?.();
  };

  return (
    <View {...props} style={[styles.toolbar, style]}>
      {children ?? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous input"
            disabled={!canNavigateBackward}
            onPress={() => focusInDirection(-1)}
            style={styles.action}
          >
            <Text style={canNavigateBackward ? styles.label : styles.disabled}>
              Previous
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next input"
            disabled={!canNavigateForward}
            onPress={() => focusInDirection(1)}
            style={styles.action}
          >
            <Text style={canNavigateForward ? styles.label : styles.disabled}>
              Next
            </Text>
          </Pressable>
          <View style={styles.spacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={done}
            style={styles.action}
          >
            <Text style={styles.label}>{doneText}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    borderTopColor: '#d8dce2',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  label: {
    color: '#155eef',
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    color: '#98a2b3',
    fontSize: 15,
  },
  spacer: {
    flex: 1,
  },
});

export default KeyboardToolbar;
