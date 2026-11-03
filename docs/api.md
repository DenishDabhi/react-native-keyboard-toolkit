# API reference

## `KeyboardAwareScrollView`

Extends React Native `ScrollViewProps`.

- `behavior?: 'smart' | 'scroll' | 'resize' | 'padding' | 'none'` (default
  `'smart'`): smart and scroll behaviors minimally scroll a covered focused
  input; padding extends the scroll range without focus scrolling; resize uses
  automatic keyboard insets on iOS and relies on window resizing on Android;
  none disables keyboard adjustment.
- `keyboardSpacing?: number` (default `16`): spacing in points.
- `enabled?: boolean` (default `true`): disable keyboard adjustments.

The component measures its viewport and the focused native input. It adds
scrollable bottom space based on measured viewport/keyboard-frame overlap,
avoiding blindly adding the full keyboard height when the OS has resized the
window. Existing numeric bottom padding is preserved.

## `KeyboardAwareView`

Extends `ViewProps`. Supports `behavior`, `keyboardSpacing`, and `enabled`.
Smart, scroll, and padding add bottom padding for the measured overlap. Resize
and none do not add padding. This view does not scroll to reveal a hidden child.

## `KeyboardProvider`

`<KeyboardProvider debug={false}>children</KeyboardProvider>`. It is optional;
set `debug` to log state changes in development.

## `KeyboardToolbar`

Extends `ViewProps` and accepts:

- `inputRefs?: readonly RefObject<TextInputRef | null>[]`: refs ordered for
  Previous/Next navigation. The currently focused ref is detected
  automatically.
- `onFocusedInputChange?: (index: number) => void`: called when a supplied ref
  becomes or ceases to be focused; `-1` means no supplied ref is focused.
- `onDone?: () => void`, `doneText?: string`, and `alwaysVisible?: boolean`.
- `children?: ReactNode`: replaces the default controls.

Previous and Next skip null/unmounted refs and are disabled when no mounted
input exists in that direction. Done blurs the focused native input when
available, calls `Keyboard.dismiss()`, then invokes `onDone`. The deprecated
`focusedInputIndex` prop remains supported for compatibility; it is not needed
for automatic focus tracking.

## `KeyboardDismissButton`

Accepts `children`, `onPress`, `dismissKeyboard` (default `true`),
`accessibilityLabel`, and React Native `ViewProps`. The optional callback runs
before keyboard dismissal.

## Hooks

- `useKeyboardState()` and its alias `useKeyboard()` return a stable
  `KeyboardState`: `{ isVisible, height, progress, animationDuration, screenY? }`.
- `useKeyboardAnimation()` returns `{ progress: Animated.Value,
animationDuration }`.
- `useFocusedInput()` returns `{ focusedInput, refresh }`; the layout is
  window-relative or `null` when the focused input cannot be measured.

The package entry point also exports `calculateKeyboardOverlap`,
`calculateScrollOffset`, `focusInput`, `getFocusedInput`, `isAndroid`, `isIOS`,
`measureFocusedInput`, and the `TextInputRef` type used by toolbar refs.

`calculateKeyboardOverlap(viewport, keyboardHeight, keyboardTop?)` returns the
measured overlap. `calculateScrollOffset(input, viewport, keyboardHeight,
spacing, currentOffset, keyboardTop?)` returns `{ offset, delta }`. The
coordinate values must use the same window-coordinate system.
