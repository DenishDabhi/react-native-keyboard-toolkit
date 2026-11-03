import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Keyboard, Text, type KeyboardEvent } from 'react-native';
import { KeyboardProvider } from '../../src/context/KeyboardContext';
import { useKeyboardState } from '../../src/hooks/useKeyboardState';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('KeyboardProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('shares one native listener with hooks and logs state changes in debug mode', async () => {
    const callbacks = new Map<string, (event: KeyboardEvent) => void>();
    const remove = jest.fn();
    const addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((eventName, listener) => {
        callbacks.set(
          String(eventName),
          listener as (event: KeyboardEvent) => void,
        );
        return { remove };
      });
    const debug = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);

    function Probe(): React.JSX.Element {
      const keyboard = useKeyboardState();
      return <Text>{`${keyboard.isVisible}:${keyboard.height}`}</Text>;
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardProvider debug>
          <Probe />
          <Probe />
        </KeyboardProvider>,
      );
    });

    expect(addListener).toHaveBeenCalledTimes(1);
    await act(async () => {
      callbacks.get('keyboardWillChangeFrame')?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 240, screenX: 0, screenY: 560, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });

    expect(debug).toHaveBeenCalledTimes(1);
    await act(async () => renderer!.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
