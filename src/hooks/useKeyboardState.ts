import { useEffect, useSyncExternalStore } from 'react';
import {
  getKeyboardState,
  subscribeKeyboardState,
  synchronizeKeyboardState,
} from '../utils/keyboardEvents';

/** Subscribe to the shared, normalized keyboard state. A provider is optional. */
export function useKeyboardState(options: { isFocused?: boolean } = {}) {
  const keyboard = useSyncExternalStore(
    subscribeKeyboardState,
    getKeyboardState,
    getKeyboardState,
  );

  useEffect(() => {
    synchronizeKeyboardState(options.isFocused !== false);
  }, [options.isFocused]);

  return keyboard;
}
