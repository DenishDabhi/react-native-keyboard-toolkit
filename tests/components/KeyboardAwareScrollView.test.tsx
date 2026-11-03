import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  type KeyboardEvent,
} from 'react-native';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import {
  getKeyboardState,
  resetKeyboardStateForTests,
} from '../../src/utils/keyboardEvents';

describe('KeyboardAwareScrollView', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('renders a native ScrollView and preserves standard props', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareScrollView testID="aware-scroll" horizontal />,
      );
    });

    const scrollView = renderer!.root.findByType(ScrollView);
    expect(scrollView.props.testID).toBe('aware-scroll');
    expect(scrollView.props.horizontal).toBe(true);

    await act(async () => renderer!.unmount());
  });

  it('does not guess at padding before it can measure the visible viewport', async () => {
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
        <KeyboardAwareScrollView
          behavior="padding"
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardSpacing={14}
          testID="padded-scroll"
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
    const scrollView = renderer!.root.findByType(ScrollView);
    expect(
      StyleSheet.flatten(scrollView.props.contentContainerStyle).paddingBottom,
    ).toBe(8);
    await act(async () => renderer!.unmount());
  });
});
