import { Platform } from 'react-native';
import type { KeyboardEventName } from 'react-native';

/** True when running on iOS. */
export const isIOS = Platform.OS === 'ios';

/** True when running on Android. */
export const isAndroid = Platform.OS === 'android';

/** Selects the native keyboard event names for the current platform. */
export function getKeyboardEventNames(): {
  show: KeyboardEventName;
  hide: KeyboardEventName;
  frameChange?: KeyboardEventName;
} {
  return isIOS
    ? {
        show: 'keyboardWillShow',
        hide: 'keyboardWillHide',
        frameChange: 'keyboardWillChangeFrame',
      }
    : { show: 'keyboardDidShow', hide: 'keyboardDidHide' };
}
