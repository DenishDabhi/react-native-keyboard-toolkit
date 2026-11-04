import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  type KeyboardEvent,
} from 'react-native';
import { KeyboardToolbar } from '../../src/components/KeyboardToolbar';
import type { TextInputRef } from '../../src/types';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('KeyboardToolbar', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    resetKeyboardStateForTests();
  });

  it('can remain visible and render custom content', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardToolbar alwaysVisible>
          <Text testID="custom-toolbar">Custom controls</Text>
        </KeyboardToolbar>,
      );
    });

    expect(
      renderer!.root.findByProps({ testID: 'custom-toolbar' }),
    ).toBeTruthy();
    act(() => renderer!.unmount());
  });

  it('focuses the next provided input', async () => {
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    let focusedIndex = 0;
    const makeInput = (index: number) => ({
      focus: jest.fn(() => {
        focusedIndex = index;
      }),
      isFocused: () => focusedIndex === index,
    });
    const first = makeInput(0);
    const second = makeInput(1);
    const inputRefs = [
      { current: first as unknown as TextInputRef },
      { current: second as unknown as TextInputRef },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardToolbar alwaysVisible inputRefs={inputRefs} />,
      );
    });

    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Next input' })
        .props.onPress();
    });
    expect(second.focus).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findByProps({ accessibilityLabel: 'Previous input' }).props
        .disabled,
    ).toBe(false);
    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Previous input' })
        .props.onPress();
    });
    expect(first.focus).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
    await act(async () => renderer!.unmount());
  });

  it('tracks manual focus changes, skips null refs, and disables boundary actions', async () => {
    jest.useFakeTimers();
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
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    let focusedIndex = 0;
    const makeInput = (index: number) => ({
      focus: jest.fn(() => {
        focusedIndex = index;
      }),
      isFocused: () => focusedIndex === index,
    });
    const first = makeInput(0);
    const last = makeInput(2);
    const onFocusedInputChange = jest.fn();
    const inputRefs = [
      { current: first as unknown as TextInputRef },
      { current: null },
      { current: last as unknown as TextInputRef },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardToolbar
          inputRefs={inputRefs}
          onFocusedInputChange={onFocusedInputChange}
        />,
      );
    });

    await act(async () => {
      callbacks.get(
        Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      )?.({
        duration: 180,
        easing: 'keyboard',
        endCoordinates: { height: 300, screenX: 0, screenY: 500, width: 400 },
        isEventFromThisApp: true,
        startCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
      });
    });

    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Next input' })
        .props.onPress();
    });
    expect(last.focus).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findByProps({ accessibilityLabel: 'Next input' }).props
        .disabled,
    ).toBe(true);

    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Previous input' })
        .props.onPress();
    });
    expect(first.focus).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();

    focusedIndex = 0;
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(
      renderer!.root.findByProps({ accessibilityLabel: 'Previous input' }).props
        .disabled,
    ).toBe(true);
    expect(onFocusedInputChange).toHaveBeenCalledWith(0);

    await act(async () => renderer!.unmount());
  });

  it('blurs the focused input, dismisses the keyboard, and supports a custom Done label', async () => {
    const focusedInput = {} as ReturnType<
      typeof TextInput.State.currentlyFocusedInput
    >;
    const blur = jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue(focusedInput);
    const blurInput = jest
      .spyOn(TextInput.State, 'blurTextInput')
      .mockImplementation(() => undefined);
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    const onDone = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardToolbar
          alwaysVisible
          doneText="Hide keyboard"
          onDone={onDone}
        />,
      );
    });

    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Hide keyboard'),
    ).toBe(true);
    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Done' })
        .props.onPress();
    });
    expect(blurInput).toHaveBeenCalledWith(focusedInput);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    blur.mockRestore();
    await act(async () => renderer!.unmount());
  });
});
