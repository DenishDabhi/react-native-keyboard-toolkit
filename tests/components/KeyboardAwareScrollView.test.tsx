import React, { createRef } from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  type KeyboardEvent,
} from 'react-native';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import type { KeyboardAwareScrollViewRef, TextInputRef } from '../../src/types';
import * as focusManager from '../../src/utils/focusManager';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('KeyboardAwareScrollView', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('renders a native ScrollView and preserves standard props', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareScrollView testID="aware-scroll" horizontal />,
      );
    });

    const scrollView = renderer!.root.findByType(ScrollView);

    expect(scrollView.props.testID).toBe('aware-scroll');
    expect(scrollView.props.horizontal).toBe(true);

    act(() => {
      renderer!.unmount();
    });
  });

  it('forwards a ref to the underlying ScrollView', () => {
    const ref = createRef<KeyboardAwareScrollViewRef>();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareScrollView ref={ref} />,
      );
    });

    expect(ref.current).toBe(renderer!.root.findByType(ScrollView).instance);

    act(() => {
      renderer!.unmount();
    });
    expect(ref.current).toBeNull();
  });

  it('preserves scroll callbacks and resize behavior', () => {
    const onScroll = jest.fn();
    const onScrollBeginDrag = jest.fn();
    const onContentSizeChange = jest.fn();
    const onLayout = jest.fn();
    const onFocusCapture = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareScrollView
          behavior="resize"
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          onFocusCapture={onFocusCapture}
        />,
      );
    });

    const scrollView = renderer!.root.findByType(ScrollView);
    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scrollView.props.scrollEventThrottle).toBe(16);

    act(() => {
      scrollView.props.onScroll({
        nativeEvent: { contentOffset: { x: 0, y: 24 } },
      });
      scrollView.props.onScrollBeginDrag({});
      scrollView.props.onContentSizeChange(300, 600);
      scrollView.props.onLayout({});
      scrollView.props.onFocusCapture({});
    });

    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScrollBeginDrag).toHaveBeenCalledTimes(1);
    expect(onContentSizeChange).toHaveBeenCalledWith(300, 600);
    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(onFocusCapture).toHaveBeenCalledTimes(1);

    act(() => {
      renderer!.unmount();
    });
  });

  it('adds measured keyboard space and scrolls a covered focused input', async () => {
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
    const focusedInput = {
      measureInWindow: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => callback(10, 700, 200, 40),
    } as unknown as TextInputRef;
    jest.spyOn(focusManager, 'getFocusedInput').mockReturnValue(focusedInput);

    const ref = createRef<KeyboardAwareScrollViewRef>();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardAwareScrollView
          ref={ref}
          contentContainerStyle={{ paddingBottom: 8 }}
        />,
      );
    });

    const scrollTo = jest
      .spyOn(ref.current!, 'scrollTo')
      .mockImplementation(() => undefined);
    jest
      .spyOn(ref.current!, 'measureInWindow')
      .mockImplementation(callback => callback(0, 0, 320, 800));

    await act(async () => {
      callbacks.get(
        Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      )?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: {
          height: 300,
          screenX: 0,
          screenY: 500,
          width: 400,
        },
        isEventFromThisApp: true,
        startCoordinates: {
          height: 0,
          screenX: 0,
          screenY: 800,
          width: 400,
        },
      });
    });

    for (let frameNumber = 0; frameNumber < 4; frameNumber += 1) {
      const frame = frames.shift();
      if (!frame) {
        break;
      }
      await act(async () => {
        frame(0);
        await Promise.resolve();
      });
    }

    const scrollView = renderer!.root.findByType(ScrollView);
    expect(focusManager.getFocusedInput).toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ y: 256, animated: true });
    expect(
      StyleSheet.flatten(scrollView.props.contentContainerStyle).paddingBottom,
    ).toBe(316);

    await act(async () => renderer!.unmount());
    jest.useRealTimers();
  });
});
