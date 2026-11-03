import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Animated, Text } from 'react-native';
import { useKeyboardAnimation } from '../../src/hooks/useKeyboardAnimation';

describe('useKeyboardAnimation', () => {
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
});
