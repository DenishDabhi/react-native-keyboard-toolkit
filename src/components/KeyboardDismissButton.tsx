import React from 'react';
import { Keyboard, Pressable } from 'react-native';
import type { KeyboardDismissButtonProps } from '../types';

/** A pressable that dismisses the software keyboard by default. */
export function KeyboardDismissButton({
  children,
  onPress,
  dismissKeyboard = true,
  accessibilityLabel = 'Dismiss keyboard',
  ...props
}: KeyboardDismissButtonProps): React.JSX.Element {
  const handlePress = () => {
    onPress?.();
    if (dismissKeyboard) {
      Keyboard.dismiss();
    }
  };

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={handlePress}
    >
      {children}
    </Pressable>
  );
}

export default KeyboardDismissButton;
