# Example app

From the repository root, install dependencies and launch the example:

```sh
npm install
npx react-native run-ios
npx react-native run-android
```

## Keyboard navigation regression check

1. Open **Navigation regression demo** and focus an input on Screen A.
2. Press **Go to Screen B**, then use Screen B's header **Back** button.
3. Confirm Screen A has no keyboard-height gap and its sticky action is back at
   the bottom. On Android, also try hardware Back from Screen B.
4. Repeat with a fast transition and with the app backgrounded while the
   keyboard is open.
