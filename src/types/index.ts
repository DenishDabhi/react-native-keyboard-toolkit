import type {
  ScrollViewProps,
  StyleProp,
  TextInput,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';

type RefTarget<T> = T extends RefObject<infer Value>
  ? NonNullable<Value>
  : never;

export type TextInputRef = RefTarget<
  NonNullable<ComponentPropsWithRef<typeof TextInput>['ref']>
>;

/** Layout strategies supported by the keyboard-aware components. */
export type KeyboardBehavior =
  | 'smart'
  | 'scroll'
  | 'resize'
  | 'padding'
  | 'none';

/** A normalized snapshot of the most recent on-screen keyboard event. */
export interface KeyboardState {
  isVisible: boolean;
  height: number;
  progress: 0 | 1;
  animationDuration: number;
  screenY?: number;
}

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Defaults to `smart`, which scrolls only when the focused field is covered. */
  behavior?: KeyboardBehavior;
  /** Space to leave between the focused field and keyboard, in points. */
  keyboardSpacing?: number;
  /** Disable keyboard-driven padding and focus scrolling. */
  enabled?: boolean;
}

export interface KeyboardAwareViewProps extends ViewProps {
  /** Defaults to `smart`. `resize` relies on the platform window resize behavior. */
  behavior?: KeyboardBehavior;
  /** Extra space between the view content and the keyboard, in points. */
  keyboardSpacing?: number;
  /** Disable keyboard-driven layout changes. */
  enabled?: boolean;
}

export interface KeyboardProviderProps {
  children: ReactNode;
  /** Log keyboard state changes in development builds. */
  debug?: boolean;
}

export interface KeyboardToolbarProps extends ViewProps {
  /** Refs to the form inputs the toolbar should navigate between. */
  inputRefs?: readonly RefObject<TextInputRef | null>[];
  /** @deprecated Focus is detected automatically from the provided input refs. */
  focusedInputIndex?: number;
  /** Called when the focused input in `inputRefs` changes. */
  onFocusedInputChange?: (index: number) => void;
  /** Called after the Done action dismisses the keyboard. */
  onDone?: () => void;
  /** Label shown by the built-in Done button. */
  doneText?: string;
  /** Replaces the built-in previous/next/done controls. */
  children?: ReactNode;
  /** Render the toolbar while the keyboard is hidden. Defaults to false. */
  alwaysVisible?: boolean;
}

export interface KeyboardDismissButtonProps extends ViewProps {
  children: ReactNode;
  /** Custom press handler. The keyboard is also dismissed unless disabled. */
  onPress?: () => void;
  /** Defaults to true. */
  dismissKeyboard?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export interface FocusedInputLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}
