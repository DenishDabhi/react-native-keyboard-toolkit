import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { useKeyboard } from '../../src/hooks/useKeyboard';

describe('useKeyboard', () => {
  it('starts in the hidden state', async () => {
    function Probe(): React.JSX.Element {
      const state = useKeyboard();
      return React.createElement(
        Text,
        null,
        `${state.isVisible}:${state.height}`,
      );
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(React.createElement(Probe));
    });

    expect(renderer!.root.findByType(Text).props.children).toBe('false:0');
    await act(async () => renderer!.unmount());
  });
});
