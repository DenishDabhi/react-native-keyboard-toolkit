import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  AppState,
  Dimensions,
  Keyboard,
  Text,
  type AppStateStatus,
  type KeyboardEvent,
} from 'react-native';
import { useKeyboardState } from '../../src/hooks/useKeyboardState';
import {
  getKeyboardState,
  resetKeyboardStateForTests,
} from '../../src/utils/keyboardEvents';

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
    const removeAppStateListener = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({
      remove: removeAppStateListener,
    });
    const removeDimensionsListener = jest.fn();
    jest.spyOn(Dimensions, 'addEventListener').mockReturnValue({
      remove: removeDimensionsListener,
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
    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
    expect(removeDimensionsListener).toHaveBeenCalledTimes(1);
  });

  it('clears a stale snapshot on final unsubscribe and resyncs on focus', async () => {
    const callbacks = new Map<string, (event: KeyboardEvent) => void>();
    const appStateCallbacks: Array<(state: AppStateStatus) => void> = [];
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
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        appStateCallbacks.push(listener);
        return { remove: jest.fn() };
      });
    jest.spyOn(Dimensions, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    });
    const isVisible = jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const metrics = jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);

    function Probe({
      focused = true,
    }: {
      focused?: boolean;
    }): React.JSX.Element {
      const state = useKeyboardState({ isFocused: focused });
      return React.createElement(
        Text,
        { testID: 'state' },
        `${state.isVisible}:${state.height}`,
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(React.createElement(Probe));
    });
    await act(async () => {
      callbacks.get('keyboardWillChangeFrame')?.({
        duration: 180,
        endCoordinates: { height: 280, screenX: 0, screenY: 500, width: 400 },
        easing: 'keyboard',
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'true:280',
    );

    await act(async () => renderer!.unmount());
    expect(getKeyboardState()).toMatchObject({
      isVisible: false,
      height: 0,
      progress: 0,
    });

    await act(async () => {
      renderer = ReactTestRenderer.create(React.createElement(Probe));
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'false:0',
    );

    isVisible.mockReturnValue(true);
    metrics.mockReturnValue({
      height: 240,
      screenX: 0,
      screenY: 560,
      width: 400,
    });
    await act(async () => {
      renderer!.update(React.createElement(Probe, { focused: false }));
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'false:0',
    );
    await act(async () => {
      renderer!.update(React.createElement(Probe, { focused: true }));
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'true:240',
    );

    isVisible.mockReturnValue(false);
    metrics.mockReturnValue(undefined);
    await act(async () => {
      appStateCallbacks[appStateCallbacks.length - 1]('background');
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'false:0',
    );

    isVisible.mockReturnValue(true);
    metrics.mockReturnValue({
      height: 220,
      screenX: 0,
      screenY: 580,
      width: 400,
    });
    await act(async () => {
      appStateCallbacks[appStateCallbacks.length - 1]('active');
    });
    expect(renderer!.root.findByProps({ testID: 'state' }).props.children).toBe(
      'true:220',
    );

    await act(async () => renderer!.unmount());
  });
});
