import React, { createRef } from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type KeyboardEvent,
} from 'react-native';
import { KeyboardAwareView } from '../../src/components/KeyboardAwareView';
import type { KeyboardAwareViewRef } from '../../src/types';
import {
  getKeyboardState,
  resetKeyboardStateForTests,
} from '../../src/utils/keyboardEvents';

describe('KeyboardAwareView', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('renders children and forwards view props', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareView testID="aware-view">
          <View testID="child" />
        </KeyboardAwareView>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'aware-view' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'child' })).toBeTruthy();

    await act(async () => renderer!.unmount());
  });

  it('forwards a ref to the underlying View', async () => {
    const ref = createRef<KeyboardAwareViewRef>();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<KeyboardAwareView ref={ref} />);
    });

    expect(ref.current).toBe(renderer!.root.findByType(View).instance);
    await act(async () => renderer!.unmount());
    expect(ref.current).toBeNull();
  });

  it('preserves existing padding until the visible overlap can be measured', async () => {
    const callbacks = new Map<string, (event: KeyboardEvent) => void>();
    jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((eventName, listener) => {
        callbacks.set(
          String(eventName),
          listener as (event: KeyboardEvent) => void,
        );
        return { remove: jest.fn() };
      });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareView
          keyboardSpacing={12}
          style={{ paddingBottom: 5 }}
          testID="spaced-view"
        />,
      );
    });
    await act(async () => {
      callbacks.get('keyboardWillChangeFrame')?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 200, screenX: 0, screenY: 600, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });

    expect(getKeyboardState()).toMatchObject({ isVisible: true, height: 200 });
    const view = renderer!.root.findByType(View);
    expect(StyleSheet.flatten(view.props.style).paddingBottom).toBe(5);
    await act(async () => renderer!.unmount());
  });

  it('moves an absolutely positioned view above the keyboard and restores it', async () => {
    const callbacks = new Map<string, (event: KeyboardEvent) => void>();
    const frames: Array<(timestamp: number) => void> = [];
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
    jest
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((eventName, listener) => {
        callbacks.set(
          String(eventName),
          listener as (event: KeyboardEvent) => void,
        );
        return { remove: jest.fn() };
      });
    const timing = jest.spyOn(Animated, 'timing');
    const ref = createRef<KeyboardAwareViewRef>();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareView
          ref={ref}
          keyboardSpacing={12}
          style={{ position: 'absolute', bottom: 0 }}
        />,
      );
    });

    Object.defineProperty(ref.current!, 'measureInWindow', {
      configurable: true,
      value: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => callback(0, 750, 320, 50),
    });

    await act(async () => {
      callbacks.get(
        Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      )?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 200, screenX: 0, screenY: 600, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });
    await act(async () => {
      frames.shift()?.(0);
    });

    expect(timing).toHaveBeenLastCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: -212,
        duration: 180,
        useNativeDriver: true,
      }),
    );

    await act(async () => {
      callbacks.get(
        Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidHide',
      )?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 200, screenX: 0, screenY: 600, width: 400 },
      });
    });
    expect(timing).toHaveBeenLastCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({ toValue: 0, duration: 180 }),
    );

    await act(async () => renderer!.unmount());
  });
});
