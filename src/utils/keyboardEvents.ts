import {
  Keyboard,
  type KeyboardEvent,
  type EmitterSubscription,
} from 'react-native';
import { DEFAULT_ANIMATION_DURATION } from './constants';
import { getKeyboardEventNames, isIOS } from './platform';
import type { KeyboardState } from '../types';

const initialState: KeyboardState = {
  isVisible: false,
  height: 0,
  progress: 0,
  animationDuration: 0,
};

let state = initialState;
let listeners: EmitterSubscription[] = [];
const subscribers = new Set<() => void>();

function update(event: KeyboardEvent, visible: boolean): void {
  const coordinates = event.endCoordinates;
  state = {
    isVisible: visible,
    height: visible ? Math.max(0, coordinates?.height ?? 0) : 0,
    progress: visible ? 1 : 0,
    animationDuration: Math.max(
      0,
      event.duration ?? DEFAULT_ANIMATION_DURATION,
    ),
    ...(visible && typeof coordinates?.screenY === 'number'
      ? { screenY: coordinates.screenY }
      : {}),
  };
  subscribers.forEach(subscriber => subscriber());
}

function syncCurrentKeyboardState(): void {
  const metrics =
    typeof Keyboard.metrics === 'function' ? Keyboard.metrics() : undefined;
  const isVisible =
    typeof Keyboard.isVisible === 'function'
      ? Keyboard.isVisible()
      : metrics != null;
  if (!isVisible || !metrics) {
    return;
  }

  state = {
    isVisible: true,
    height: metrics.height,
    progress: 1,
    animationDuration: 0,
    screenY: metrics.screenY,
  };
  subscribers.forEach(subscriber => subscriber());
}

function startListening(): void {
  const names = getKeyboardEventNames();
  if (isIOS && names.frameChange) {
    listeners = [
      Keyboard.addListener(names.frameChange, event =>
        update(event, event.endCoordinates.height > 0),
      ),
    ];
    syncCurrentKeyboardState();
    return;
  }

  const showSubscription = Keyboard.addListener(names.show, event =>
    update(event, true),
  );
  const hideSubscription = Keyboard.addListener(names.hide, event =>
    update(event, false),
  );
  listeners = [showSubscription, hideSubscription];
  syncCurrentKeyboardState();
}

function stopListening(): void {
  listeners.forEach(subscription => subscription.remove());
  listeners = [];
}

/** Subscribe to the shared keyboard event stream. */
export function subscribeKeyboardState(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  if (subscribers.size === 1) {
    startListening();
  }
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopListening();
    }
  };
}

/** Return the stable current snapshot used by `useSyncExternalStore`. */
export function getKeyboardState(): KeyboardState {
  return state;
}

/** Reset the shared state and event listeners; intended for tests. */
export function resetKeyboardStateForTests(): void {
  stopListening();
  subscribers.clear();
  state = initialState;
}
