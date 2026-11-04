import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  type KeyboardEvent,
} from 'react-native';
import { useFocusedInput } from '../../src/hooks/useFocusedInput';
import type { TextInputRef } from '../../src/types';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('useFocusedInput', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('measures the focused input when the keyboard opens and clears it when hidden', async () => {
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
    const focusedInput = {
      measureInWindow: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => callback(12, 340, 280, 48),
    } as unknown as TextInputRef;
    jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue(focusedInput);

    function Probe(): React.JSX.Element {
      const { focusedInput: layout } = useFocusedInput();
      return (
        <Text>
          {layout ? `${layout.x}:${layout.y}:${layout.height}` : 'none'}
        </Text>
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    expect(renderer!.root.findByType(Text).props.children).toBe('none');

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
    expect(renderer!.root.findByType(Text).props.children).toBe('12:340:48');

    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidHide';
    await act(async () => {
      callbacks.get(hideEvent)?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 300, screenX: 0, screenY: 500, width: 400 },
      });
    });
    expect(renderer!.root.findByType(Text).props.children).toBe('none');

    await act(async () => renderer!.unmount());
  });
});
