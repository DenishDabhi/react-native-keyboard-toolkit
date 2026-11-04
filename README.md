# react-native-keyboard-toolkit

A lightweight **React Native keyboard toolkit** for iOS and Android. It
provides a keyboard-aware `ScrollView`, keyboard-avoiding `View`, keyboard
toolbar with Previous/Next input navigation, keyboard dismissal controls, and
keyboard visibility/height/animation hooks.

The package uses React Native's keyboard events and view measurements. It does
not add native modules, require manual linking, or require an Expo config
plugin. It is designed for React Native forms, login screens, long scrollable
forms, focused `TextInput` handling, and keyboard layout adjustments.

## Features

- Scroll a covered focused `TextInput` into view.
- Measure keyboard visibility, height, frame, and animation timing.
- Share keyboard state across components and hooks.
- Provide keyboard-aware scroll and view components with configurable behavior.
- Navigate between input refs and dismiss the keyboard with `KeyboardToolbar`.
- Access the focused input's measured frame and keyboard utility functions.
- Support React Native CLI and Expo without linking or an Expo config plugin.

## Installation

```sh
npm install react-native-keyboard-toolkit
```

React and React Native are peer dependencies. No CocoaPods installation or
manual linking is needed.

### React Native CLI

Use the package from JavaScript or TypeScript as shown below. On Android,
`adjustResize` is recommended so the app's available window reflects the
keyboard:

```xml
<activity
    android:name=".MainActivity"
    android:windowSoftInputMode="adjustResize"
    ... />
```

Keep the other attributes from your existing `MainActivity` declaration. No
iOS project or Pod changes are required.

### Expo

Install the JavaScript package with npm, yarn, or your package manager. No
config plugin or prebuild change is required. The demo's safe-area layout uses
`react-native-safe-area-context`; that package is not required by the library
itself.

## Basic usage

`KeyboardProvider` is optional. It can log keyboard state changes in
development when `debug` is enabled.

```tsx
import React from 'react';
import { TextInput } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardProvider,
} from 'react-native-keyboard-toolkit';

export default function ProfileForm(): React.JSX.Element {
  return (
    <KeyboardProvider>
      <KeyboardAwareScrollView
        behavior="smart"
        keyboardShouldPersistTaps="handled"
        keyboardSpacing={16}
      >
        <TextInput placeholder="Name" />
        <TextInput placeholder="Email" keyboardType="email-address" />
        <TextInput placeholder="Notes" multiline />
      </KeyboardAwareScrollView>
    </KeyboardProvider>
  );
}
```

Compose the components with the safe-area and navigation layout already used
by your app. Keyboard frame measurements use window coordinates and the
visible component frame; no safe-area package is imported by the library.

## Components

### `KeyboardAwareScrollView`

This component extends React Native `ScrollViewProps`.

| Prop              | Default   | Description                                                                                                                                                                                                                                                                                         |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `behavior`        | `"smart"` | `"smart"` and `"scroll"` scroll a covered focused input and maintain the needed scroll range. `"padding"` adds scrollable keyboard space without focus scrolling. `"resize"` uses iOS keyboard insets when available and relies on Android window resizing. `"none"` disables keyboard adjustments. |
| `keyboardSpacing` | `16`      | Extra space, in points, between the focused field and the keyboard.                                                                                                                                                                                                                                 |
| `enabled`         | `true`    | Disable keyboard-aware adjustments while preserving normal `ScrollView` behavior.                                                                                                                                                                                                                   |

The component measures its viewport and the focused native input. It scrolls
only when the field is outside the visible region, and bases its extra content
space on the portion of the keyboard that overlaps the measured viewport. This
avoids blindly adding the full keyboard height when Android has already resized
the window. Use it for long forms and forms with bottom actions that must remain
reachable by scrolling.

```tsx
import React from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-toolkit';

export function ContactForm(): React.JSX.Element {
  return (
    <KeyboardAwareScrollView
      behavior="smart"
      keyboardSpacing={20}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
    >
      <TextInput placeholder="Name" />
      <TextInput placeholder="Email" keyboardType="email-address" />
      <TextInput placeholder="Message" multiline />
      <Pressable onPress={() => {}}>
        <Text>Submit</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
```

`behavior="scroll"` also scrolls focused inputs. `behavior="padding"` is useful
when you want extra scroll range but do not want automatic focus scrolling.
Avoid combining multiple keyboard-padding wrappers around the same content
unless the extra spacing is intentional.

### `KeyboardAwareView`

`KeyboardAwareView` extends `ViewProps` and supports `behavior`,
`keyboardSpacing`, and `enabled`. It adds bottom padding for the measured
keyboard overlap when its behavior is `"smart"`, `"scroll"`, or `"padding"`.
It does not scroll to identify a hidden child; use `KeyboardAwareScrollView`
for a long or scrollable form. `"resize"` and `"none"` do not add keyboard
padding.

```tsx
import React from 'react';
import { Text, TextInput } from 'react-native';
import { KeyboardAwareView } from 'react-native-keyboard-toolkit';

export function ShortForm(): React.JSX.Element {
  return (
    <KeyboardAwareView
      behavior="smart"
      keyboardSpacing={12}
      style={{ flex: 1, justifyContent: 'space-between', padding: 20 }}
    >
      <TextInput placeholder="One short field" />
      <Text>Actions in this view move above the keyboard.</Text>
    </KeyboardAwareView>
  );
}
```

### `KeyboardToolbar`

Pass refs in navigation order. The toolbar checks the refs to find the
currently-focused input, so an application does not need to maintain a
`focusedInputIndex`. Refs that are null or no longer mounted are skipped.
Previous and Next are disabled when no mounted input exists in that direction.
Focus navigation calls `focus()` on the next ref and does not request keyboard
dismissal.

```tsx
import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import {
  KeyboardToolbar,
  type TextInputRef,
} from 'react-native-keyboard-toolkit';

export function LoginFields(): React.JSX.Element {
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);

  return (
    <View>
      <KeyboardToolbar
        inputRefs={[emailRef, passwordRef]}
        doneText="Hide keyboard"
        onFocusedInputChange={index => {
          // index is -1 when none of the supplied refs is focused.
          console.log('Focused input index:', index);
        }}
        onDone={() => console.log('Keyboard dismissed')}
        style={{ backgroundColor: '#f5f5f5' }}
      />
      <TextInput
        ref={emailRef}
        placeholder="Email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextInput
        ref={passwordRef}
        placeholder="Password"
        secureTextEntry
        returnKeyType="done"
      />
    </View>
  );
}
```

`KeyboardToolbar` renders while the keyboard is visible. Set
`alwaysVisible` to keep it mounted while the keyboard is hidden. `doneText`
customizes the Done label; `style` and other `ViewProps` customize the toolbar
container. Providing `children` replaces all built-in controls. The component
is a regular in-layout view, not a native iOS input accessory.

The Done action blurs the currently focused native input when available,
requests `Keyboard.dismiss()`, and then calls `onDone`.

### `KeyboardDismissButton`

Use this accessible pressable to dismiss the keyboard from an in-layout
control. Its optional `onPress` callback runs before dismissal.

```tsx
import React from 'react';
import { Text } from 'react-native';
import { KeyboardDismissButton } from 'react-native-keyboard-toolkit';

export function DismissControl(): React.JSX.Element {
  return (
    <KeyboardDismissButton onPress={() => console.log('Dismiss pressed')}>
      <Text>Dismiss keyboard</Text>
    </KeyboardDismissButton>
  );
}
```

Set `dismissKeyboard={false}` to run a custom action without dismissing the
keyboard. `accessibilityLabel`, `style`, and other `ViewProps` are supported.

## Hooks and keyboard state

The hooks use a shared event subscription and work with or without
`KeyboardProvider`.

### `useKeyboard` and `useKeyboardState`

Both hooks return the same `KeyboardState` snapshot:

```ts
{
  isVisible: boolean;
  height: number;
  progress: 0 | 1;
  animationDuration: number;
  screenY?: number;
}
```

The height and `screenY` are reported in React Native points from the native
keyboard event or keyboard metrics when available. They are the keyboard frame,
not the overlap of a particular view; the aware components calculate overlap
using their own measured viewport.

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-toolkit';

export function KeyboardIndicator(): React.JSX.Element {
  const { isVisible, height, screenY } = useKeyboardState();
  return (
    <View>
      <Text>{isVisible ? `Keyboard: ${height} pt` : 'Keyboard hidden'}</Text>
      {screenY !== undefined && <Text>Top edge: {screenY} pt</Text>}
    </View>
  );
}
```

`useKeyboard()` is an alias for `useKeyboardState()`.

### `useKeyboardAnimation`

This hook returns `{ progress: Animated.Value, animationDuration: number }`.
The value animates between `0` (hidden) and `1` (visible) using the native event
duration, and respects the system reduced-motion setting.

```tsx
import React from 'react';
import { Animated, Text } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-toolkit';

export function AnimatedKeyboardLabel(): React.JSX.Element {
  const { progress } = useKeyboardAnimation();
  return (
    <Animated.View style={{ opacity: progress }}>
      <Text>Keyboard is appearing</Text>
    </Animated.View>
  );
}
```

### `useFocusedInput`

Returns `{ focusedInput, refresh }`. The focused input is either `null` or a
window-relative `{ x, y, width, height }` layout in points. It measures while
the software keyboard is visible; call `refresh()` after custom layout changes
when an immediate updated measurement is needed.

```tsx
import React from 'react';
import { Text } from 'react-native';
import { useFocusedInput } from 'react-native-keyboard-toolkit';

export function FocusedFieldPosition(): React.JSX.Element {
  const { focusedInput, refresh } = useFocusedInput();
  return (
    <Text onPress={() => void refresh()}>
      {focusedInput
        ? `Focused field top: ${Math.round(focusedInput.y)} pt`
        : 'No measured focused field'}
    </Text>
  );
}
```

### Low-level utilities

The package also exports helpers used by the aware components:

- `getFocusedInput()` returns the focused native input when React Native exposes
  it, otherwise `null`.
- `measureFocusedInput(input?)` measures that input in window coordinates and
  resolves to a `{ x, y, width, height }` layout or `null`.
- `focusInput(ref)` calls `focus()` when the ref is mounted and returns whether
  an input was available.
- `calculateKeyboardOverlap(viewport, keyboardHeight, keyboardTop?)` returns
  the measured overlap in points.
- `calculateScrollOffset(input, viewport, keyboardHeight, spacing,
currentOffset, keyboardTop?)` returns `{ offset, delta }` for a minimal
  scroll adjustment.
- `isAndroid` and `isIOS` identify the current React Native platform.

The calculation helpers expect the input and viewport coordinates to use the
same window-coordinate system. Most apps should use the aware components
instead of calling these calculation helpers directly.

## Keyboard height and dismissal

`useKeyboardState()` exposes the most recent keyboard frame, including its
height, top edge when supplied by the platform, visibility, and event
animation duration. On iOS the shared event store listens for frame changes;
on Android it listens for keyboard show/hide events. Components measure their
own viewport against that frame instead of adding the reported height blindly.
Android `adjustResize` can already shrink a view, so the measured overlap may be
zero even while the keyboard state reports a nonzero keyboard height.

Use `Keyboard.dismiss()` from React Native, `KeyboardDismissButton`, or the
toolbar's Done action to dismiss the software keyboard. The library does not
change the focused field unless the native platform's dismissal behavior or
toolbar Done action blurs it.

## Customization and TypeScript

All components accept their corresponding React Native props, plus the
keyboard-specific options documented above. Public component prop types,
`KeyboardState`, `KeyboardBehavior`, and `FocusedInputLayout` are exported:

```tsx
import type {
  FocusedInputLayout,
  KeyboardAwareScrollViewProps,
  KeyboardBehavior,
  KeyboardState,
  KeyboardToolbarProps,
} from 'react-native-keyboard-toolkit';

const formBehavior: KeyboardBehavior = 'smart';
const scrollProps: KeyboardAwareScrollViewProps = {
  behavior: formBehavior,
  keyboardSpacing: 18,
};
const toolbarProps: KeyboardToolbarProps = { doneText: 'Close' };
const initialState: KeyboardState = {
  isVisible: false,
  height: 0,
  progress: 0,
  animationDuration: 0,
};
const inputLayout: FocusedInputLayout | null = null;
```

`KeyboardToolbarProps.focusedInputIndex` remains available for compatibility
with older code, but normal use should rely on ref-based automatic tracking.

## Android and iOS notes

- **Android:** `adjustResize` is recommended. When the OS has resized a view,
  measured overlap prevents adding the keyboard height a second time. Test
  edge-to-edge configurations and modal windows on your target Android versions.
- **iOS:** the package listens for keyboard frame-change events. For
  `behavior="resize"`, the scroll view opts into React Native's automatic
  keyboard insets. Test safe-area, navigation, modal, and interactive-dismissal
  layouts in your app.
- The package does not configure safe areas, navigation, window flags, or
  keyboard animation worklets. Compose it with your existing layout setup.
- Floating/split keyboards, third-party keyboards, and modal/window overlays
  can report different frames. Measurement-based adjustment is best-effort;
  verify the specific devices and configurations you ship.

## Troubleshooting

- **An input is still covered:** use `KeyboardAwareScrollView`, confirm that
  the focused native input is inside its scroll view, and check that another
  ancestor is not clipping the content.
- **A bottom button is not reachable:** keep it inside the aware scroll view so
  it participates in the scroll range, and set
  `keyboardShouldPersistTaps="handled"` when appropriate.
- **The layout moves twice:** avoid stacking aware padding wrappers and check
  for app-level `KeyboardAvoidingView`, keyboard insets, or other keyboard
  padding around the same content.
- **Toolbar controls are disabled:** pass refs for mounted text inputs in the
  intended order. A ref must point at a mounted `TextInput` for navigation.
- **Height is nonzero but the view does not add the same amount:** this is
  expected when Android has already resized the measured viewport.
- **State does not update:** verify that the input opens the software keyboard;
  a hardware keyboard may not produce a visible software keyboard frame.

## Common questions

### Does this package require native linking or CocoaPods changes?

No. The toolkit is implemented in JavaScript/TypeScript using React Native APIs.
Install it with your package manager and rebuild your app as you normally do
after adding a dependency.

### Does it replace `KeyboardAvoidingView`?

It provides additional keyboard-aware scrolling, measured keyboard overlap,
input navigation, and keyboard-state hooks. You can use the components that fit
your screen; avoid stacking multiple keyboard-adjustment wrappers around the
same content unless the combined spacing is intentional.

### Why might a focused input not scroll into view on Android?

Check that the Activity uses `android:windowSoftInputMode="adjustResize"`,
that the input is inside `KeyboardAwareScrollView`, and that no parent layout
clips or independently offsets the same content. See [Android notes](docs/android.md)
and [Troubleshooting](docs/troubleshooting.md).

## Demo and validation

The single-file demo in [`demo/App.tsx`](demo/App.tsx) exercises the actual
local library implementation, keyboard hooks, behavior presets, safe-area
composition, multiline input, toolbar navigation, and bottom form actions.
Start Metro with `npm start`, then run `npm run android` or `npm run ios`.

Run the repository checks with:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm pack --dry-run
```

Automated tests do not replace interactive Android and iOS device testing.

## Compatibility

The package declares React `>=18.2.0` and React Native `>=0.71.0` peer
dependencies. Development currently targets React `19.3.0` and React Native
`0.88.1`; older peer-range versions and Expo SDK/device combinations have not
been verified in this repository.

## License

MIT. See [LICENSE](LICENSE).
