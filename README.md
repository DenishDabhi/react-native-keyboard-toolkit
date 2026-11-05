# react-native-keyboard-toolkit

[![npm version](https://img.shields.io/npm/v/react-native-keyboard-toolkit.svg)](https://www.npmjs.com/package/react-native-keyboard-toolkit)
[![license](https://img.shields.io/npm/l/react-native-keyboard-toolkit.svg)](LICENSE)
![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-blue.svg)

Keyboard-aware scroll view, sticky submit button, input toolbar, and keyboard hooks for React Native on iOS and Android. Keep focused `TextInput` fields visible, move footers above the keyboard, and read keyboard state — all in plain TypeScript, with no native module, linking, or config plugin.

## Features

- **`KeyboardAwareScrollView`** – a `ScrollView` that scrolls a covered input into view.
- **`KeyboardAwareView`** – adds bottom space to normal content, or lifts an absolutely positioned footer above the keyboard (sticky button).
- **`KeyboardToolbar`** – Previous / Next / Done controls for moving between inputs.
- **`KeyboardDismissButton`** – a `Pressable` that dismisses the keyboard.
- **Hooks** – `useKeyboardState` (alias `useKeyboard`), `useKeyboardAnimation`, `useFocusedInput`.
- **Utilities** – `focusInput`, `getFocusedInput`, `measureFocusedInput`, `calculateKeyboardOverlap`, `calculateScrollOffset`, `isIOS`, `isAndroid`.
- Written in TypeScript with bundled type declarations.

## Installation

```sh
npm install react-native-keyboard-toolkit
# or
yarn add react-native-keyboard-toolkit
```

**Requirements:** React `>=18.2.0`, React Native `>=0.71.0`. No iOS setup is needed.

On Android, set `adjustResize` on your activity in `AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:windowSoftInputMode="adjustResize"
    ... />
```

## Quick start

### Keyboard-aware form

```tsx
import React from 'react';
import { TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-toolkit';

export function ContactForm() {
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      keyboardSpacing={16}
      contentContainerStyle={{ padding: 20 }}
    >
      <TextInput placeholder="Name" />
      <TextInput placeholder="Email" keyboardType="email-address" />
      <TextInput placeholder="Message" multiline />
    </KeyboardAwareScrollView>
  );
}
```

### Sticky submit button

Put a `KeyboardAwareView` with `position: 'absolute'` next to the scroll view. It animates above the keyboard and returns to its original place when the keyboard closes.

```tsx
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareView,
} from 'react-native-keyboard-toolkit';

export function StickyForm() {
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        keyboardSpacing={112} // leave room for the footer
        contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
      >
        <TextInput placeholder="Name" />
        <TextInput placeholder="Email" keyboardType="email-address" />
        <TextInput placeholder="Company" />
        <TextInput placeholder="Message" multiline />
      </KeyboardAwareScrollView>

      <KeyboardAwareView
        keyboardSpacing={12}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: 'white',
        }}
      >
        <Pressable onPress={() => console.log('Submit')}>
          <Text>Submit</Text>
        </Pressable>
      </KeyboardAwareView>
    </View>
  );
}
```

Set the scroll view's `keyboardSpacing` to roughly your footer height so focused inputs are not hidden behind it.

### Previous / Next / Done toolbar

Pass your input refs in navigation order. The toolbar renders only while the keyboard is visible.

```tsx
import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
  type TextInputRef,
} from 'react-native-keyboard-toolkit';

export function SignUpForm() {
  const name = useRef<TextInputRef>(null);
  const email = useRef<TextInputRef>(null);
  const password = useRef<TextInputRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        <TextInput ref={name} placeholder="Name" />
        <TextInput ref={email} placeholder="Email" />
        <TextInput ref={password} placeholder="Password" secureTextEntry />
      </KeyboardAwareScrollView>

      <KeyboardToolbar inputRefs={[name, email, password]} />
    </View>
  );
}
```

## API

### `KeyboardAwareScrollView`

Accepts all `ScrollView` props, forwards its ref to the `ScrollView`, and adds:

| Prop              | Type                                                     | Default   | Description                                                                          |
| ----------------- | -------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `behavior`        | `'smart' \| 'scroll' \| 'resize' \| 'padding' \| 'none'` | `'smart'` | See [Behaviors](#behaviors).                                                         |
| `keyboardSpacing` | `number`                                                 | `16`      | Gap (points) between the focused input and the keyboard. Negative values become `0`. |
| `enabled`         | `boolean`                                                | `true`    | Turns keyboard padding and focus scrolling on or off.                                |

### `KeyboardAwareView`

Accepts all `View` props, forwards its ref to the native view, and supports `behavior`, `keyboardSpacing` (default `16`), and `enabled`.

- **Normal layout:** adds bottom padding equal to the part of the view covered by the keyboard.
- **`position: 'absolute'`:** animates the view up so it clears the keyboard plus `keyboardSpacing`.
- It does not scroll to reveal hidden children.

### `KeyboardToolbar`

Accepts all `View` props plus:

| Prop                   | Type                                | Default  | Description                                                                                          |
| ---------------------- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `inputRefs`            | `RefObject<TextInputRef \| null>[]` | `[]`     | Inputs in navigation order. The focused input is detected automatically; unmounted refs are skipped. |
| `onFocusedInputChange` | `(index: number) => void`           | –        | Called when the focused input changes (`-1` = none of `inputRefs`).                                  |
| `onDone`               | `() => void`                        | –        | Called after Done dismisses the keyboard.                                                            |
| `doneText`             | `string`                            | `'Done'` | Label of the Done button.                                                                            |
| `alwaysVisible`        | `boolean`                           | `false`  | Show the toolbar even when the keyboard is hidden.                                                   |
| `children`             | `ReactNode`                         | –        | Replaces the built-in Previous / Next / Done controls.                                               |

### `KeyboardDismissButton`

A `Pressable` (accepts `View` props) that dismisses the keyboard when pressed.

| Prop                 | Type         | Default              | Description                               |
| -------------------- | ------------ | -------------------- | ----------------------------------------- |
| `children`           | `ReactNode`  | required             | Button content.                           |
| `onPress`            | `() => void` | –                    | Runs before the keyboard is dismissed.    |
| `dismissKeyboard`    | `boolean`    | `true`               | Set `false` to skip `Keyboard.dismiss()`. |
| `accessibilityLabel` | `string`     | `'Dismiss keyboard'` | Accessibility label.                      |

### `KeyboardProvider`

Optional. Wrap your app in `<KeyboardProvider debug>` to log keyboard changes in development builds. Components and hooks work without it.

### Behaviors

| Value       | `KeyboardAwareScrollView`                                               | `KeyboardAwareView`                    |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `'smart'`   | Adds scroll space and scrolls only when the focused input is covered    | Adjusts for keyboard overlap (default) |
| `'scroll'`  | Same as `'smart'`                                                       | Same as `'smart'`                      |
| `'padding'` | Adds scroll space only, no focus scrolling                              | Same as `'smart'`                      |
| `'resize'`  | Leaves resizing to the platform (uses automatic keyboard insets on iOS) | No adjustment                          |
| `'none'`    | No adjustment                                                           | No adjustment                          |

### Hooks

```tsx
import {
  useKeyboardState,
  useKeyboardAnimation,
  useFocusedInput,
} from 'react-native-keyboard-toolkit';

const { isVisible, height, progress, animationDuration, screenY } =
  useKeyboardState(); // `useKeyboard()` is an alias

const { progress: anim, animationDuration: ms } = useKeyboardAnimation();
// `anim` is an Animated.Value (0 → 1); updates instantly if Reduce Motion is on

const { focusedInput, refresh } = useFocusedInput();
// focusedInput: { x, y, width, height } in window coordinates, or null
```

| Hook                     | Returns                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `useKeyboardState()`     | `{ isVisible, height, progress (0 \| 1), animationDuration, screenY? }`                   |
| `useKeyboardAnimation()` | `{ progress: Animated.Value, animationDuration }`                                         |
| `useFocusedInput()`      | `{ focusedInput, refresh }` – the focused input's layout, and a function to re-measure it |

Example: animate a view with the keyboard.

```tsx
import { Animated } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-toolkit';

function FadeWithKeyboard({ children }: { children: React.ReactNode }) {
  const { progress } = useKeyboardAnimation();
  return (
    <Animated.View style={{ opacity: progress }}>{children}</Animated.View>
  );
}
```

### Utilities and types

- `focusInput(ref)` – focuses a `TextInput` ref; returns `false` if the ref is empty.
- `getFocusedInput()` / `measureFocusedInput(input?)` – get or measure the focused input.
- `calculateKeyboardOverlap(viewport, keyboardHeight, keyboardTop?)` and `calculateScrollOffset(input, viewport, keyboardHeight, spacing, currentOffset, keyboardTop?)` – the layout math used internally.
- `isIOS`, `isAndroid` – platform flags.
- Types: `KeyboardState`, `KeyboardBehavior`, `TextInputRef`, `FocusedInputLayout`, `KeyboardAwareScrollViewProps`, `KeyboardAwareScrollViewRef`, `KeyboardAwareViewProps`, `KeyboardAwareViewRef`, `KeyboardToolbarProps`, `KeyboardDismissButtonProps`, `KeyboardProviderProps`.

## Tips

- Use React Native `TextInput` fields inside `KeyboardAwareScrollView`. Custom input wrappers must forward refs and support native measurement.
- Use only one keyboard-spacing component per region to avoid adding space twice.
- Keyboard coordinates can differ across devices, edge-to-edge modes, and modals — test on the devices you support.

More guides: [Installation](docs/installation.md) · [API](docs/api.md) · [Android](docs/android.md) · [iOS](docs/ios.md) · [Troubleshooting](docs/troubleshooting.md)

## License

[MIT](LICENSE) © Denish Dabhi
