import { useCallback, useEffect, useRef, useState } from 'react';
import type { FocusedInputLayout } from '../types';
import { getFocusedInput, measureFocusedInput } from '../utils/focusManager';
import { useKeyboardState } from './useKeyboardState';

/** Measure the focused TextInput when the keyboard opens; call `refresh` after layout changes. */
export function useFocusedInput(): {
  focusedInput: FocusedInputLayout | null;
  refresh: () => Promise<FocusedInputLayout | null>;
} {
  const keyboard = useKeyboardState();
  const [focusedInput, setFocusedInput] = useState<FocusedInputLayout | null>(
    null,
  );
  const measureSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++measureSequence.current;
    const layout = await measureFocusedInput(getFocusedInput());
    if (sequence === measureSequence.current) {
      setFocusedInput(current => {
        if (
          current?.x === layout?.x &&
          current?.y === layout?.y &&
          current?.width === layout?.width &&
          current?.height === layout?.height
        ) {
          return current;
        }
        return layout;
      });
    }
    return layout;
  }, []);

  useEffect(() => {
    if (!keyboard.isVisible) {
      measureSequence.current += 1;
      setFocusedInput(null);
      return;
    }

    refresh();
    const interval = setInterval(refresh, 120);
    return () => {
      measureSequence.current += 1;
      clearInterval(interval);
    };
  }, [keyboard.isVisible, keyboard.height, refresh]);

  return { focusedInput, refresh };
}
