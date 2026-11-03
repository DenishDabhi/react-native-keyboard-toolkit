import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Keyboard, Text } from 'react-native';
import { KeyboardDismissButton } from '../../src/components/KeyboardDismissButton';

describe('KeyboardDismissButton', () => {
  it('dismisses the keyboard when pressed', async () => {
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined);
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <KeyboardDismissButton>
          <Text>Done</Text>
        </KeyboardDismissButton>,
      );
    });

    await act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: 'Dismiss keyboard' })
        .props.onPress();
    });

    expect(dismiss).toHaveBeenCalledTimes(1);
    dismiss.mockRestore();
    await act(async () => renderer!.unmount());
  });
});
