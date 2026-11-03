import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useKeyboardState } from '../hooks/useKeyboardState';
import type { KeyboardProviderProps } from '../types';

const DebugContext = createContext(false);

/** Optional provider for development diagnostics; keyboard subscriptions are shared globally. */
export function KeyboardProvider({
  children,
  debug = false,
}: KeyboardProviderProps): React.JSX.Element {
  const keyboard = useKeyboardState();
  const previous = useRef(keyboard);

  useEffect(() => {
    if (
      debug &&
      __DEV__ &&
      (previous.current.isVisible !== keyboard.isVisible ||
        previous.current.height !== keyboard.height)
    ) {
      console.debug('[keyboard-shepherd]', keyboard);
    }
    previous.current = keyboard;
  }, [debug, keyboard]);

  return (
    <DebugContext.Provider value={debug}>{children}</DebugContext.Provider>
  );
}

/** Read whether development diagnostics are enabled on the nearest provider. */
export function useKeyboardDebug(): boolean {
  return useContext(DebugContext);
}
