# react-native-keyboard-toolkit

[![npm version](https://img.shields.io/npm/v/react-native-keyboard-toolkit.svg)](https://www.npmjs.com/package/react-native-keyboard-toolkit)
[![license](https://img.shields.io/npm/l/react-native-keyboard-toolkit.svg)](LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-blue.svg)](#supported-platforms)

Keyboard-aware scrolling, layout helpers, hooks, and focus utilities for React Native.

`react-native-keyboard-toolkit` is a **JavaScript-only** library. It is built on React Native's own `Keyboard` events and view measurements (`measureInWindow`), so it has **no native module, no CocoaPods step, no manual linking, and no Babel plugin**.

- [Features](#features)
- [Supported platforms](#supported-platforms)
- [Compatibility and requirements](#compatibility-and-requirements)
- [Installation](#installation)
- [Setup](#setup)
- [Basic usage](#basic-usage)
- [Components](#components)
  - [`KeyboardAwareScrollView`](#keyboardawarescrollview)
  - [`KeyboardAwareView`](#keyboardawareview)
  - [`KeyboardToolbar`](#keyboardtoolbar)
  - [`KeyboardDismissButton`](#keyboarddismissbutton)
  - [`KeyboardProvider`](#keyboardprovider)
- [Hooks](#hooks)
  - [`useKeyboardState` / `useKeyboard`](#usekeyboardstate--usekeyboard)
  - [`useKeyboardAnimation`](#usekeyboardanimation)
  - [`useFocusedInput`](#usefocusedinput)
- [Utility functions](#utility-functions)
- [Complete React Native CLI example](#complete-react-native-cli-example)
- [TypeScript](#typescript)
- [API reference](#api-reference)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Example project](#example-project)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

## Features

- **`KeyboardAwareScrollView`** – a `ScrollView` that adds space for the keyboard and scrolls a covered, focused `TextInput` into view.
- **`KeyboardAwareView`** – a lightweight `View` that adds bottom space while the keyboard covers it.
- **`KeyboardToolbar`** – an in-layout toolbar with Previous / Next / Done controls for moving between input refs.
- **`KeyboardDismissButton`** – an accessible pressable that dismisses the keyboard.
- **Hooks** – `useKeyboardState` (alias `useKeyboard`), `useKeyboardAnimation`, and `useFocusedInput`.
- **Shared keyboard state** – one native event subscription is shared by every component and hook, and it is cleaned up automatically.
- **Focus and layout utilities** – `getFocusedInput`, `measureFocusedInput`, `focusInput`, `calculateKeyboardOverlap`, and `calculateScrollOffset`.
- **Overlap-based adjustment** – components measure how much of _themselves_ the keyboard actually covers instead of blindly adding the full keyboard height, which avoids double spacing when Android has already resized the window.
- **Five layout behaviors** – `smart`, `scroll`, `padding`, `resize`, and `none`.
- **Written in TypeScript** – type declarations are bundled.

## Supported platforms

| Platform            | Support                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| iOS                 | Supported                                                               |
| Android             | Supported                                                               |
| Expo                | JavaScript-only, so no config plugin is needed (not tested – see below) |
| Web, Windows, macOS | Not supported                                                           |

## Compatibility and requirements

| Requirement    | Version                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `react`        | `>=18.2.0` (uses `useSyncExternalStore`)                                    |
| `react-native` | `>=0.71.0`                                                                  |
| TypeScript     | Optional. Declarations are included and work with `@types/react` 18 and 19. |

The package was checked against these combinations (TypeScript compile of an app that imports the packed package, Jest render of every component and hook, and a Metro bundle where noted):

| React Native | React  | Type check | Jest render |   Metro bundle    |
| ------------ | ------ | :--------: | :---------: | :---------------: |
| 0.71.19      | 18.2.0 |     ✅     |     ✅      |        ✅         |
| 0.76.9       | 18.3.1 |     ✅     |     ✅      |         –         |
| 0.88.1       | 19.3.0 |     ✅     |     ✅      | ✅ (Android, iOS) |

These are automated checks. **The library has not been validated on physical devices or simulators/emulators**, and Expo SDK projects have not been tested. Keyboard geometry differs between devices, OS versions, keyboards, and window configurations, so please test the screens you ship. See [`docs/ios.md`](docs/ios.md) and [`docs/android.md`](docs/android.md) for device checklists.

## Installation

```sh
npm install react-native-keyboard-toolkit
# or
yarn add react-native-keyboard-toolkit
# or
pnpm add react-native-keyboard-toolkit
```

### Required peer dependencies

These must already be in your app (every React Native app has them):

| Package        | Version    | Why                                                     |
| -------------- | ---------- | ------------------------------------------------------- |
| `react`        | `>=18.2.0` | Hooks and `useSyncExternalStore`.                       |
| `react-native` | `>=0.71.0` | `Keyboard`, `TextInput`, `ScrollView`, `Animated`, etc. |

### Optional dependencies

The library has **no other runtime dependencies** and does not import any third-party package.

| Package                          | When you might want it                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-native-safe-area-context` | To lay out your screens inside the safe area (notch, home indicator). **Not required by this library** – it is only used by the repository's demo app. |

If you want it, install it as described in its own documentation:

```sh
npm install react-native-safe-area-context
```

### Dependency installation checklist

1. `npm install react-native-keyboard-toolkit`
2. Nothing else for the library itself. There is no `pod install` step _for this package_. (As usual in a React Native CLI app, run `cd ios && pod install` after adding any other native dependency.)
3. Restart Metro (`npx react-native start --reset-cache`) if it was already running.

## Setup

### React Native CLI

No native changes are required for the library. For the best results on Android, keep the standard resizing window mode on your activity (the React Native CLI template already uses it):

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:windowSoftInputMode="adjustResize"
    ... />
```

Keep the other attributes of your existing `MainActivity` declaration. If you use `adjustPan` or an edge-to-edge configuration, see [Troubleshooting](#troubleshooting) and [`docs/android.md`](docs/android.md).

On iOS there is nothing to configure.

### Expo

The package contains only JavaScript, so it needs no config plugin or prebuild step. This has not been tested in an Expo project by the maintainers; please report any problems.

### Provider (optional)

Wrapping your app in [`KeyboardProvider`](#keyboardprovider) is **optional**. The components and hooks work without it. It only enables development logging through its `debug` prop.

## Basic usage

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
        contentContainerStyle={{ padding: 20, gap: 12 }}
      >
        <TextInput placeholder="Name" />
        <TextInput placeholder="Email" keyboardType="email-address" />
        <TextInput placeholder="Notes" multiline />
      </KeyboardAwareScrollView>
    </KeyboardProvider>
  );
}
```

All public exports come from the package root:

```ts
import {
  // components
  KeyboardAwareScrollView,
  KeyboardAwareView,
  KeyboardToolbar,
  KeyboardDismissButton,
  KeyboardProvider,
  // hooks
  useKeyboard,
  useKeyboardState,
  useKeyboardAnimation,
  useFocusedInput,
  // utilities
  calculateKeyboardOverlap,
  calculateScrollOffset,
  focusInput,
  getFocusedInput,
  measureFocusedInput,
  isAndroid,
  isIOS,
} from 'react-native-keyboard-toolkit';
```

Deep imports (for example `react-native-keyboard-toolkit/src/...`) are not supported.

## Components

### `KeyboardAwareScrollView`

A drop-in replacement for React Native's `ScrollView`. It accepts every `ScrollViewProps` plus the props below, and forwards a `ref` to the underlying `ScrollView` instance.

| Prop              | Type                                                     | Default   | Description                                                                                                      |
| ----------------- | -------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `behavior`        | `'smart' \| 'scroll' \| 'padding' \| 'resize' \| 'none'` | `'smart'` | Layout strategy. See [Behaviors](#behaviors).                                                                    |
| `keyboardSpacing` | `number`                                                 | `16`      | Space, in points, kept between the focused input / content and the keyboard. Negative values are treated as `0`. |
| `enabled`         | `boolean`                                                | `true`    | When `false`, keyboard padding and focus scrolling are disabled and it behaves like a normal `ScrollView`.       |

`scrollEventThrottle` defaults to `16`. The component wraps `onScroll`, `onScrollBeginDrag`, `onContentSizeChange`, `onLayout`, and `onFocusCapture`; your handlers are still called.

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
      keyboardDismissMode="interactive"
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

**Using the ref** (for example to call `scrollTo`):

```tsx
import React, { useRef } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-toolkit';

export function ScrollToTopForm(): React.JSX.Element {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);

  return (
    <KeyboardAwareScrollView ref={scrollRef}>
      <TextInput placeholder="Name" />
      <TextInput placeholder="Email" />
      <Pressable
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      >
        <Text>Back to top</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
```

#### Behaviors

| `behavior`  | Adds bottom padding for the keyboard | Scrolls the focused input into view | Notes                                                                                                                                               |
| ----------- | :----------------------------------: | :---------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'smart'`   |                  ✅                  |     ✅ (only if it is covered)      | Default. Currently identical to `'scroll'`.                                                                                                         |
| `'scroll'`  |                  ✅                  |     ✅ (only if it is covered)      | Currently identical to `'smart'`.                                                                                                                   |
| `'padding'` |                  ✅                  |                 ❌                  | Extends the scroll range only; you decide what scrolls.                                                                                             |
| `'resize'`  |                  ❌                  |                 ❌                  | On iOS, turns on `ScrollView`'s `automaticallyAdjustKeyboardInsets` (unless you set that prop yourself). On Android, relies on the window resizing. |
| `'none'`    |                  ❌                  |                 ❌                  | No keyboard adjustment.                                                                                                                             |

Details that are useful to know:

- The padding added is `max(existing paddingBottom, keyboardOverlap + keyboardSpacing)`. An existing numeric `paddingBottom` is preserved, not added to. A non-numeric (string) `paddingBottom` disables the extra padding.
- Padding is based on the part of the scroll view's viewport the keyboard actually covers. If Android's `adjustResize` has already shrunk the view, the overlap is `0` and no extra padding is added.
- Do not stack multiple keyboard-padding wrappers (for example your own `KeyboardAvoidingView`) around the same content unless you want extra spacing.

### `KeyboardAwareView`

A `View` that adds bottom padding for the part of itself that the keyboard covers. It accepts every `ViewProps` plus the same three props as the scroll view, and forwards a `ref` to the underlying `View`.

| Prop              | Type                                                     | Default   | Description                                                               |
| ----------------- | -------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| `behavior`        | `'smart' \| 'scroll' \| 'padding' \| 'resize' \| 'none'` | `'smart'` | `smart`, `scroll`, and `padding` add padding; `resize` and `none` do not. |
| `keyboardSpacing` | `number`                                                 | `16`      | Extra space, in points, between the content and the keyboard.             |
| `enabled`         | `boolean`                                                | `true`    | When `false`, the view never adds padding.                                |

It does **not** scroll anything. Use [`KeyboardAwareScrollView`](#keyboardawarescrollview) for long or scrollable forms. As with the scroll view, a numeric `paddingBottom` in `style` is preserved (the larger value wins) and a string `paddingBottom` disables the adjustment.

```tsx
import React from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { KeyboardAwareView } from 'react-native-keyboard-toolkit';

export function ShortForm(): React.JSX.Element {
  return (
    <KeyboardAwareView
      behavior="smart"
      keyboardSpacing={12}
      style={{ flex: 1, justifyContent: 'space-between', padding: 20 }}
    >
      <TextInput placeholder="One short field" />
      <Pressable onPress={() => {}}>
        <Text>Continue</Text>
      </Pressable>
    </KeyboardAwareView>
  );
}
```

### `KeyboardToolbar`

An **in-layout** toolbar (a regular `View`, not a native iOS input accessory view) with _Previous_, _Next_, and _Done_ controls. Pass the refs of your inputs in navigation order.

| Prop                       | Type                                         | Default  | Description                                                                                            |
| -------------------------- | -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `inputRefs`                | `readonly RefObject<TextInputRef \| null>[]` | `[]`     | Refs of the inputs to navigate between, in order. Null / unmounted refs are skipped.                   |
| `onFocusedInputChange`     | `(index: number) => void`                    | –        | Called when the focused input among `inputRefs` changes. `index` is `-1` when none of them is focused. |
| `onDone`                   | `() => void`                                 | –        | Called after _Done_ has blurred the input and dismissed the keyboard.                                  |
| `doneText`                 | `string`                                     | `'Done'` | Label of the built-in _Done_ button.                                                                   |
| `alwaysVisible`            | `boolean`                                    | `false`  | By default the toolbar renders `null` while the keyboard is hidden. Set `true` to keep it rendered.    |
| `children`                 | `ReactNode`                                  | –        | Replaces the built-in Previous / Next / Done controls entirely.                                        |
| `style`, other `ViewProps` | `ViewProps`                                  | –        | Applied to the toolbar container.                                                                      |
| `focusedInputIndex`        | `number`                                     | –        | **Deprecated.** Focus is detected automatically from `inputRefs`.                                      |

Behavior notes:

- The focused input is detected by calling `isFocused()` on the supplied refs (polled every 100 ms while the toolbar is active), so you do not need to track an index yourself.
- _Previous_ / _Next_ call `focus()` on the nearest mounted ref in that direction and are disabled when there is none.
- _Done_ blurs the currently focused native input, calls `Keyboard.dismiss()`, then calls `onDone`.
- The built-in button labels ("Previous", "Next") and accessibility labels are English only. Pass `children` to render your own controls.
- Because it is a normal view, place it in your layout above the keyboard. The pattern used by the demo app is to put it at the bottom of the screen, wrapped in a `KeyboardAwareView` so it is lifted above the keyboard.

```tsx
import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareView,
  KeyboardToolbar,
  type TextInputRef,
} from 'react-native-keyboard-toolkit';

export function LoginScreen(): React.JSX.Element {
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <TextInput
          ref={emailRef}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextInput
          ref={passwordRef}
          placeholder="Password"
          secureTextEntry
          returnKeyType="done"
        />
      </KeyboardAwareScrollView>

      <KeyboardAwareView keyboardSpacing={0}>
        <KeyboardToolbar
          inputRefs={[emailRef, passwordRef]}
          doneText="Hide keyboard"
          onFocusedInputChange={index => {
            // index is -1 when none of the supplied refs is focused.
            console.log('Focused input index:', index);
          }}
          onDone={() => console.log('Keyboard dismissed')}
        />
      </KeyboardAwareView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12 },
});
```

Custom toolbar content:

```tsx
import React from 'react';
import { Text } from 'react-native';
import {
  KeyboardDismissButton,
  KeyboardToolbar,
} from 'react-native-keyboard-toolkit';

export function CustomToolbar(): React.JSX.Element {
  return (
    <KeyboardToolbar style={{ justifyContent: 'flex-end' }}>
      <KeyboardDismissButton>
        <Text>Close keyboard</Text>
      </KeyboardDismissButton>
    </KeyboardToolbar>
  );
}
```

### `KeyboardDismissButton`

An accessible `Pressable` (`accessibilityRole="button"`) that dismisses the software keyboard.

| Prop                 | Type                   | Default              | Description                                                                             |
| -------------------- | ---------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `children`           | `ReactNode`            | – (required)         | Button content.                                                                         |
| `onPress`            | `() => void`           | –                    | Called first; the keyboard is dismissed afterwards unless `dismissKeyboard` is `false`. |
| `dismissKeyboard`    | `boolean`              | `true`               | Set `false` to run `onPress` without dismissing the keyboard.                           |
| `accessibilityLabel` | `string`               | `'Dismiss keyboard'` | Accessibility label.                                                                    |
| `style`              | `StyleProp<ViewStyle>` | –                    | Style of the pressable (function styles are not supported).                             |

It also accepts the other `ViewProps`, which are passed through to the underlying `Pressable`.

```tsx
import React from 'react';
import { Text } from 'react-native';
import { KeyboardDismissButton } from 'react-native-keyboard-toolkit';

export function DismissControl(): React.JSX.Element {
  return (
    <KeyboardDismissButton
      accessibilityLabel="Close keyboard"
      onPress={() => console.log('Dismiss pressed')}
      style={{ padding: 12 }}
    >
      <Text>Dismiss keyboard</Text>
    </KeyboardDismissButton>
  );
}
```

### `KeyboardProvider`

Optional. It renders its children unchanged and, when `debug` is `true`, logs keyboard visibility/height changes with `console.debug('[keyboard-toolkit]', state)` and the scroll calculations of `KeyboardAwareScrollView`. Logging only happens in development builds (`__DEV__`).

| Prop       | Type        | Default | Description                        |
| ---------- | ----------- | ------- | ---------------------------------- |
| `children` | `ReactNode` | –       | Your app or screen.                |
| `debug`    | `boolean`   | `false` | Log keyboard state in development. |

```tsx
import React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-toolkit';
import { Screens } from './Screens';

export default function App(): React.JSX.Element {
  return (
    <KeyboardProvider debug={__DEV__}>
      <Screens />
    </KeyboardProvider>
  );
}
```

## Hooks

All hooks share a single native subscription and work with or without `KeyboardProvider`.

### `useKeyboardState` / `useKeyboard`

`useKeyboard()` is an alias for `useKeyboardState()`. Both return the current `KeyboardState`:

```ts
interface KeyboardState {
  isVisible: boolean;
  height: number; // keyboard frame height in points; 0 when hidden
  progress: 0 | 1; // 1 when visible, 0 when hidden
  animationDuration: number; // native event duration in ms
  screenY?: number; // top edge of the keyboard on screen, when reported
}
```

`height` and `screenY` describe the **keyboard frame**, not the overlap with a particular view; the aware components measure their own overlap. On Android, React Native reports a `duration` of `0`, so `animationDuration` is `0` there.

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

#### Reacting to keyboard events

The hooks re-render your component whenever the keyboard state changes, so any effect that depends on the state is a keyboard event handler:

```tsx
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useKeyboard } from 'react-native-keyboard-toolkit';

export function KeyboardLogger(): React.JSX.Element {
  const keyboard = useKeyboard();

  useEffect(() => {
    if (keyboard.isVisible) {
      console.log(`Keyboard opened (${keyboard.height} pt)`);
    } else {
      console.log('Keyboard closed');
    }
  }, [keyboard.isVisible, keyboard.height]);

  return <Text>{keyboard.isVisible ? 'Typing…' : 'Idle'}</Text>;
}
```

### `useKeyboardAnimation`

Returns `{ progress: Animated.Value; animationDuration: number }`. `progress` animates between `0` (hidden) and `1` (visible) over the native event duration, and jumps instantly when the system _Reduce Motion_ setting is enabled.

The animation uses the native driver, so apply `progress` only to properties the native driver supports (such as `opacity` and `transform`), not to layout properties like `height`.

```tsx
import React from 'react';
import { Animated, Text } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-toolkit';

export function AnimatedKeyboardLabel(): React.JSX.Element {
  const { progress } = useKeyboardAnimation();

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <Text>Keyboard is visible</Text>
    </Animated.View>
  );
}
```

### `useFocusedInput`

Returns `{ focusedInput, refresh }`.

- `focusedInput` is `null` or a window-relative `{ x, y, width, height }` layout (`FocusedInputLayout`) of the focused `TextInput`.
- It measures while the keyboard is visible (on open, on height changes, and every 120 ms), and resets to `null` when the keyboard hides.
- `refresh()` measures immediately and resolves with the new layout (or `null`). Call it after a layout change if you need an up-to-date value right away.

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

## Utility functions

These low-level helpers are what the components are built on. Most apps will not need them.

| Function                                                                                       | Returns                               | Description                                                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `getFocusedInput()`                                                                            | `{ measureInWindow } \| null`         | The currently focused native `TextInput` (from `TextInput.State`), or `null`.                                                  |
| `measureFocusedInput(input?)`                                                                  | `Promise<FocusedInputLayout \| null>` | Measures an input (default: the focused one) in window coordinates.                                                            |
| `focusInput(ref)`                                                                              | `boolean`                             | Calls `focus()` on a `RefObject<TextInputRef \| null>`; `false` if the ref is empty.                                           |
| `calculateKeyboardOverlap(viewport, keyboardHeight, keyboardTop?)`                             | `number`                              | How many points of `viewport` (`{ y, height }`) the keyboard covers. Uses `keyboardTop` (the keyboard's `screenY`) when given. |
| `calculateScrollOffset(input, viewport, keyboardHeight, spacing, currentOffset, keyboardTop?)` | `{ offset: number; delta: number }`   | The smallest scroll adjustment that brings `input` (`{ y, height }`) into the unobscured part of `viewport`.                   |
| `isIOS`, `isAndroid`                                                                           | `boolean`                             | Constants for the current `Platform.OS`.                                                                                       |

All coordinates passed to the calculation helpers must use the same window-coordinate system (for example values from `measureInWindow`).

```tsx
import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import {
  focusInput,
  getFocusedInput,
  isIOS,
  measureFocusedInput,
  type FocusedInputLayout,
  type TextInputRef,
} from 'react-native-keyboard-toolkit';

export function UtilityDemo(): React.JSX.Element {
  const inputRef = useRef<TextInputRef>(null);
  const [layout, setLayout] = useState<FocusedInputLayout | null>(null);

  return (
    <View>
      <TextInput ref={inputRef} placeholder="Tap a button below" />
      <Text onPress={() => focusInput(inputRef)}>Focus the input</Text>
      <Text
        onPress={async () =>
          setLayout(await measureFocusedInput(getFocusedInput()))
        }
      >
        Measure the focused input ({isIOS ? 'iOS' : 'Android'})
      </Text>
      {layout && (
        <Text>
          y = {Math.round(layout.y)}, height = {Math.round(layout.height)}
        </Text>
      )}
    </View>
  );
}
```

```ts
import {
  calculateKeyboardOverlap,
  calculateScrollOffset,
} from 'react-native-keyboard-toolkit';

// A 600 pt tall viewport starting at y = 100, with a 300 pt keyboard whose
// top edge is at y = 500:
const viewport = { y: 100, height: 600 };
const overlap = calculateKeyboardOverlap(viewport, 300, 500); // 200

// An input at y = 520 (height 40) is hidden behind the keyboard. With 16 pt
// of spacing and the content currently scrolled to 0, scroll by this much:
const { delta, offset } = calculateScrollOffset(
  { y: 520, height: 40 },
  viewport,
  300,
  16,
  0,
  500,
); // delta = 76, offset = 76
```

## Complete React Native CLI example

This walks through a fresh React Native CLI project from start to finish.

**1. Create the app and install the library**

```sh
npx @react-native-community/cli@latest init MyApp
cd MyApp
npm install react-native-keyboard-toolkit
```

**2. Android window mode** – the template's `AndroidManifest.xml` already contains `android:windowSoftInputMode="adjustResize"` on `MainActivity`. Keep it.

**3. iOS** – nothing to do for this library. If you have not installed pods yet, run `bundle install && cd ios && bundle exec pod install && cd ..` as usual for a new React Native project.

**4. Replace `App.tsx`**

```tsx
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareView,
  KeyboardDismissButton,
  KeyboardProvider,
  KeyboardToolbar,
  useKeyboard,
  type TextInputRef,
} from 'react-native-keyboard-toolkit';

function KeyboardBadge(): React.JSX.Element {
  const { isVisible, height } = useKeyboard();
  return (
    <Text style={styles.badge}>
      {isVisible
        ? `Keyboard open (${Math.round(height)} pt)`
        : 'Keyboard closed'}
    </Text>
  );
}

function SignUpScreen(): React.JSX.Element {
  const nameRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);
  const bioRef = useRef<TextInputRef>(null);
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.screen}>
      <KeyboardBadge />

      <KeyboardAwareScrollView
        behavior="smart"
        keyboardSpacing={20}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Create your profile</Text>

        <TextInput
          ref={nameRef}
          style={styles.input}
          placeholder="Full name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextInput
          ref={emailRef}
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => bioRef.current?.focus()}
        />
        <TextInput
          ref={bioRef}
          style={[styles.input, styles.multiline]}
          placeholder="A little about you"
          multiline
          textAlignVertical="top"
        />

        <Pressable style={styles.submit} onPress={() => setSaved(true)}>
          <Text style={styles.submitText}>
            {saved ? 'Saved' : 'Save profile'}
          </Text>
        </Pressable>

        <KeyboardDismissButton style={styles.dismiss}>
          <Text>Dismiss keyboard</Text>
        </KeyboardDismissButton>
      </KeyboardAwareScrollView>

      <KeyboardAwareView keyboardSpacing={0}>
        <KeyboardToolbar inputRefs={[nameRef, emailRef, bioRef]} />
      </KeyboardAwareView>
    </View>
  );
}

export default function App(): React.JSX.Element {
  return (
    <KeyboardProvider debug={__DEV__}>
      <SignUpScreen />
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', paddingTop: 48 },
  badge: { textAlign: 'center', color: '#475467', paddingVertical: 8 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 96 },
  submit: {
    backgroundColor: '#155eef',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitText: { color: '#ffffff', fontWeight: '600' },
  dismiss: { alignItems: 'center', padding: 12 },
});
```

**5. Run it**

```sh
npx react-native start
# in another terminal
npx react-native run-android   # or: npx react-native run-ios
```

Prefer the safe area? Wrap the screen with the component from `react-native-safe-area-context` (installed separately) – the library does not depend on it and works the same inside it:

```tsx
import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-toolkit';
import { Screens } from './Screens';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Screens />
        </SafeAreaView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
```

## TypeScript

Type declarations ship with the package. The following types are exported from the package root:

| Type                           | Description                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `KeyboardBehavior`             | `'smart' \| 'scroll' \| 'resize' \| 'padding' \| 'none'`                         |
| `KeyboardState`                | Shape returned by `useKeyboardState` / `useKeyboard`.                            |
| `FocusedInputLayout`           | `{ x, y, width, height }` returned by `useFocusedInput` / `measureFocusedInput`. |
| `TextInputRef`                 | The `TextInput` instance type, for refs passed to the toolbar.                   |
| `KeyboardAwareScrollViewProps` | Props of `KeyboardAwareScrollView`.                                              |
| `KeyboardAwareScrollViewRef`   | Instance type of the `ScrollView` behind `KeyboardAwareScrollView`.              |
| `KeyboardAwareViewProps`       | Props of `KeyboardAwareView`.                                                    |
| `KeyboardAwareViewRef`         | Instance type of the `View` behind `KeyboardAwareView`.                          |
| `KeyboardToolbarProps`         | Props of `KeyboardToolbar`.                                                      |
| `KeyboardDismissButtonProps`   | Props of `KeyboardDismissButton`.                                                |
| `KeyboardProviderProps`        | Props of `KeyboardProvider`.                                                     |

```tsx
import React from 'react';
import {
  KeyboardAwareScrollView,
  type FocusedInputLayout,
  type KeyboardAwareScrollViewProps,
  type KeyboardBehavior,
  type KeyboardState,
  type KeyboardToolbarProps,
} from 'react-native-keyboard-toolkit';

const formBehavior: KeyboardBehavior = 'smart';

const scrollProps: KeyboardAwareScrollViewProps = {
  behavior: formBehavior,
  keyboardSpacing: 18,
  keyboardShouldPersistTaps: 'handled',
};

const toolbarProps: KeyboardToolbarProps = { doneText: 'Close' };

const hiddenKeyboard: KeyboardState = {
  isVisible: false,
  height: 0,
  progress: 0,
  animationDuration: 0,
};

const noLayout: FocusedInputLayout | null = null;

export function TypedForm(): React.JSX.Element {
  return (
    <KeyboardAwareScrollView
      {...scrollProps}
      accessibilityLabel={`${toolbarProps.doneText ?? ''} ${
        hiddenKeyboard.height
      } ${noLayout?.x ?? 0}`}
    />
  );
}
```

## API reference

### Components

| Export                    | Props                                                                                                                                  | Ref instance                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `KeyboardAwareScrollView` | `ScrollViewProps` + `behavior`, `keyboardSpacing`, `enabled`                                                                           | `KeyboardAwareScrollViewRef` |
| `KeyboardAwareView`       | `ViewProps` + `behavior`, `keyboardSpacing`, `enabled`                                                                                 | `KeyboardAwareViewRef`       |
| `KeyboardToolbar`         | `ViewProps` + `inputRefs`, `onFocusedInputChange`, `onDone`, `doneText`, `alwaysVisible`, `children`, `focusedInputIndex` (deprecated) | –                            |
| `KeyboardDismissButton`   | `ViewProps` + `children`, `onPress`, `dismissKeyboard`, `accessibilityLabel`, `style`                                                  | –                            |
| `KeyboardProvider`        | `children`, `debug`                                                                                                                    | –                            |

### Hooks

| Export                 | Signature                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `useKeyboardState`     | `() => KeyboardState`                                                                                    |
| `useKeyboard`          | Alias of `useKeyboardState`.                                                                             |
| `useKeyboardAnimation` | `() => { progress: Animated.Value; animationDuration: number }`                                          |
| `useFocusedInput`      | `() => { focusedInput: FocusedInputLayout \| null; refresh: () => Promise<FocusedInputLayout \| null> }` |

### Functions and constants

| Export                     | Signature                                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getFocusedInput`          | `() => Pick<TextInputRef, 'measureInWindow'> \| null`                                                                                                                                                        |
| `measureFocusedInput`      | `(input?: Pick<TextInputRef, 'measureInWindow'> \| null) => Promise<FocusedInputLayout \| null>`                                                                                                             |
| `focusInput`               | `(input: RefObject<TextInputRef \| null>) => boolean`                                                                                                                                                        |
| `calculateKeyboardOverlap` | `(viewport: { y: number; height: number }, keyboardHeight: number, keyboardTop?: number) => number`                                                                                                          |
| `calculateScrollOffset`    | `(input: { y: number; height: number }, viewport: { y: number; height: number }, keyboardHeight: number, spacing: number, currentOffset: number, keyboardTop?: number) => { offset: number; delta: number }` |
| `isIOS`, `isAndroid`       | `boolean`                                                                                                                                                                                                    |

## How it works

- **One shared subscription.** The first component or hook that subscribes starts the native keyboard listeners; the last one to unmount stops them. If the keyboard is already open when the first subscriber mounts, the state is initialised from `Keyboard.metrics()`.
- **iOS** listens to `keyboardWillChangeFrame`. iOS reports a hidden keyboard as a frame moved _below_ the screen (with its height unchanged), so the keyboard is considered visible only while its top edge is above the bottom of the screen.
- **Android** listens to `keyboardDidShow` and `keyboardDidHide`.
- **Overlap, not height.** `KeyboardAwareScrollView` and `KeyboardAwareView` measure themselves with `measureInWindow` and intersect that rectangle with the keyboard frame. The reported keyboard height can therefore be non-zero while the measured overlap is `0` (for example when Android `adjustResize` already shrank the view).
- **Focused input.** The focused field comes from `TextInput.State.currentlyFocusedInput()` and is measured with `measureInWindow`.
- Floating or split keyboards, third-party keyboards, and modal windows can report different frames. Measurement-based adjustment is best-effort; verify the devices and configurations you ship.

## Troubleshooting

**An input is still covered by the keyboard.**
Use `KeyboardAwareScrollView`, confirm the focused native `TextInput` is _inside_ that scroll view, and check that no ancestor clips its content. `behavior` must be `'smart'` or `'scroll'` and `enabled` must be `true` for focus scrolling.

**The focused field does not scroll.**
Make sure it is a native React Native `TextInput` (not an unmeasurable third-party wrapper) that has completed layout. If a custom wrapper delays focus, call `refresh()` from [`useFocusedInput`](#usefocusedinput) after layout settles.

**A bottom button is not reachable.**
Keep the button _inside_ the aware scroll view so it is part of the scroll range, and set `keyboardShouldPersistTaps="handled"` so the first tap is not swallowed by dismissing the keyboard.

**The layout moves twice / there is too much space.**
Avoid stacking keyboard-padding wrappers (an app-level `KeyboardAvoidingView`, keyboard insets, or multiple aware components) around the same content. When a `KeyboardAwareView` wraps a `KeyboardAwareScrollView`, the outer view lifts the content and the inner scroll view then measures no overlap. If two components still both adjust, disable one with `enabled={false}` or `behavior="none"`.

**The keyboard height is non-zero but the view does not add the same amount.**
This is expected. Components add padding for the _measured overlap_, which is `0` when Android has already resized the window (`adjustResize`).

**Android: content moves twice, or nothing moves.**
Use `android:windowSoftInputMode="adjustResize"` on your activity. Edge-to-edge configurations and some OEM keyboards report coordinates relative to a different window origin; test on your target devices. See [`docs/android.md`](docs/android.md).

**Keyboard height is `0` or unexpected.**
A hardware keyboard may not open a software keyboard. Floating and split keyboards occupy only part of the screen. Heights can vary with navigation bars and OS versions.

**`KeyboardToolbar` controls are disabled.**
Pass refs to _mounted_ `TextInput`s in the intended order. A ref must point at a mounted input for navigation to work. The toolbar is not rendered while the keyboard is hidden unless `alwaysVisible` is set.

**The toolbar is not above the keyboard.**
`KeyboardToolbar` is a normal in-layout view, not a native input accessory. Place it at the bottom of your screen layout, ideally inside a `KeyboardAwareView` as shown in the examples.

**The keyboard hides a field inside a modal.**
Place the aware scroll view inside the modal content and test on the target platform; modal window frames and insets differ from the main screen.

**`ref` on `KeyboardAwareScrollView` is `null`.**
The ref is set after mount. Read `ref.current` in event handlers or effects, not during render.

**State does not update.**
Verify that focusing the input actually opens the _software_ keyboard (not available on some simulators with a connected hardware keyboard: toggle _I/O → Keyboard → Toggle Software Keyboard_ on the iOS simulator).

**Using the hooks in Jest tests.**
The hooks and components render under React Native's Jest preset without extra setup. To simulate keyboard events, spy on `Keyboard.addListener`, capture the listener, and call it with a `KeyboardEvent`-shaped object (see the repository's `tests/` folder for examples).

For more, see the platform notes: [`docs/ios.md`](docs/ios.md) and [`docs/android.md`](docs/android.md).

## Example project

The repository contains a React Native CLI host app that exercises every component and hook against the local source (`demo/App.tsx`, mounted from `App.tsx`). It includes a keyboard-state panel, behavior pickers, a long form, a compact `KeyboardAwareView` layout, toolbar navigation, and utility buttons.

```sh
git clone https://github.com/DenishDabhi/react-native-keyboard-toolkit.git
cd react-native-keyboard-toolkit
npm ci

# iOS only, first time
bundle install
cd ios && bundle exec pod install && cd ..

npm start            # Metro
npm run android      # in another terminal
npm run ios          # in another terminal
```

The demo uses `react-native-safe-area-context` (a dev dependency of this repository, not of the library). The native projects are still named `MyKeywordHandler` (the module name registered in `app.json`); the name shown on the device is "Keyboard Toolkit Demo".

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

```sh
npm ci
npm run validate   # typecheck, lint, prettier check, tests, build, npm pack --dry-run
```

Individual scripts: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. Please add tests for behavior changes and update this README when the public API changes. Report security issues as described in [`SECURITY.md`](SECURITY.md).

## License

[MIT](LICENSE) © Denish Dabhi

## Links

- GitHub: <https://github.com/DenishDabhi/react-native-keyboard-toolkit>
- Issues: <https://github.com/DenishDabhi/react-native-keyboard-toolkit/issues>
- npm: <https://www.npmjs.com/package/react-native-keyboard-toolkit>
- Changelog: [`CHANGELOG.md`](CHANGELOG.md)
