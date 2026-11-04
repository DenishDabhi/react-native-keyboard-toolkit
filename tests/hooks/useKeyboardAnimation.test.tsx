import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Platform,
  Text,
  type KeyboardEvent,
} from 'react-native';
import { useKeyboardAnimation } from '../../src/hooks/useKeyboardAnimation';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('useKeyboardAnimation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('returns an animated progress value and initial event duration', async () => {
    function Probe(): React.JSX.Element {
      const { progress, animationDuration } = useKeyboardAnimation();
      return (
        <Text testID="animation">
          {`${progress instanceof Animated.Value}:${animationDuration}`}
        </Text>
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });

    expect(
      renderer!.root.findByProps({ testID: 'animation' }).props.children,
    ).toBe('true:0');
    await act(async () => renderer!.unmount());
  });

  it('animates to keyboard state and respects reduced motion', async () => {
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
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const timing = jest.spyOn(Animated, 'timing');

    function Probe(): React.JSX.Element {
      const { progress, animationDuration } = useKeyboardAnimation();
      return (
        <Text testID="animation">
          {`${progress instanceof Animated.Value}:${animationDuration}`}
        </Text>
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    await act(async () => {
      callbacks.get(showEvent)?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 300, screenX: 0, screenY: 500, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });

    expect(
      renderer!.root.findByProps({ testID: 'animation' }).props.children,
    ).toBe('true:180');
    expect(timing).toHaveBeenLastCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({ toValue: 1, duration: 0 }),
    );

    await act(async () => renderer!.unmount());
  });
});
