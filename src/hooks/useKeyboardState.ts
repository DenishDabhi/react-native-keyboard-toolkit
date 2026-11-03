import { useSyncExternalStore } from 'react';
import {
  getKeyboardState,
  subscribeKeyboardState,
} from '../utils/keyboardEvents';

/** Subscribe to the shared, normalized keyboard state. A provider is optional. */
export function useKeyboardState() {
  return useSyncExternalStore(
    subscribeKeyboardState,
    getKeyboardState,
    getKeyboardState,
  );
}
