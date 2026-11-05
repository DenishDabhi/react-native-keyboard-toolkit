# Android testing and setup

The library listens to `keyboardDidShow` / `keyboardDidHide`, measures native
input and scroll-view frames, and reads the reported keyboard screen coordinate
when available. It does not edit `MainActivity`, `MainApplication`, or the
manifest.

For common form behavior, configure the activity to use `adjustResize`. The
repository app already uses this setting. The components intersect the measured
viewport with the keyboard's reported top frame; if `adjustResize` has already
ended the viewport at that frame, the measured overlap is zero and no second
keyboard-height inset is added. OEM keyboards and edge-to-edge configurations
can still report coordinates relative to different window origins.

For a sticky submit action, put an absolutely positioned
`KeyboardAwareView` outside the scroll view. With `adjustResize`, Android may
already move the footer as the window changes size; the measured keyboard frame
is used to apply only any remaining displacement and configured spacing.

## Device checklist

- Test Android 10+ devices/emulators and the app's minimum supported OS.
- Try both gesture and three-button navigation.
- Test `adjustResize` and, if the app supports it, `adjustPan`.
- Test status/navigation bars, edge-to-edge, and any translucent system bars.
- Test multiline inputs, modal screens, nested scroll views, and input focus
  during navigation transitions.
- Try at least one hardware keyboard and one alternate software keyboard.

This project has not been validated on physical Android devices. Do not treat
these notes as device compatibility claims.
