import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Keyboard, Text, type KeyboardEvent } from 'react-native';
import { useKeyboardState } from '../../src/hooks/useKeyboardState';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('shared keyboard state', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('shares one native listener and updates subscribers on keyboard events', async () => {
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

    function Probe(): React.JSX.Element {
      const state = useKeyboardState();
      return React.createElement(
        Text,
        null,
        `${state.isVisible}:${state.height}`,
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Probe),
          React.createElement(Probe),
        ),
      );
    });

    expect(addListener).toHaveBeenCalledTimes(1);
    await act(async () => {
      callbacks.get('keyboardWillChangeFrame')?.({
        duration: 180,
        endCoordinates: { height: 280, screenX: 0, screenY: 500, width: 400 },
        easing: 'keyboard',
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });
    expect(
      renderer!.root.findAllByType(Text).map(text => text.props.children),
    ).toEqual(['true:280', 'true:280']);

    await act(async () => {
      callbacks.get('keyboardWillChangeFrame')?.({
        duration: 180,
        endCoordinates: { height: 340, screenX: 0, screenY: 460, width: 400 },
        easing: 'keyboard',
        isEventFromThisApp: true,
        startCoordinates: { height: 280, screenX: 0, screenY: 500, width: 400 },
      });
    });
    expect(
      renderer!.root.findAllByType(Text).map(text => text.props.children),
    ).toEqual(['true:340', 'true:340']);

    await act(async () => renderer!.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
