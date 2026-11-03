# Installation

```sh
npm install react-native-keyboard-toolkit
```

React and React Native are peer dependencies. The package uses only React Native
JavaScript APIs, so it does not require native linking, a Pod, a config plugin,
or a custom Expo development client.

## React Native CLI

1. Install the package in the app.
2. Use `KeyboardAwareScrollView` around the form content.
3. On Android, keep the activity's `windowSoftInputMode` at `adjustResize` for
   the conventional resizable-window behavior.

## Expo

Use the package from an Expo app as you would any JavaScript-only dependency.
The keyboard APIs are included in Expo Go. The development demo lives in the
repository's React Native host app; it is not a generated Expo project.
