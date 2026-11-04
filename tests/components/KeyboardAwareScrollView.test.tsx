import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { resetKeyboardStateForTests } from '../../src/utils/keyboardEvents';

describe('KeyboardAwareScrollView', () => {
  afterEach(() => {
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
});
