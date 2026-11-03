import { TextInput } from 'react-native';
import type { RefObject } from 'react';
import type { FocusedInputLayout, TextInputRef } from '../types';

type Measurable = Pick<TextInputRef, 'measureInWindow'>;

/** Returns the currently focused native TextInput when React Native exposes it. */
export function getFocusedInput(): Measurable | null {
  const input = TextInput.State.currentlyFocusedInput?.();
  if (input) {
    return input;
  }

  return null;
}

/** Measure the focused TextInput in window coordinates. */
export function measureFocusedInput(
  input: Measurable | null = getFocusedInput(),
): Promise<FocusedInputLayout | null> {
  if (!input?.measureInWindow) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    input.measureInWindow?.((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}

/** Request focus on a TextInput ref and return whether a native input was available. */
export function focusInput(input: RefObject<TextInputRef | null>): boolean {
  const node = input.current;
  if (!node) {
    return false;
  }
  node.focus();
  return true;
}
