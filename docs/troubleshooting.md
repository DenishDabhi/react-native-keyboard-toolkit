# Troubleshooting

## The focused field does not scroll

- Confirm the input is a native React Native `TextInput`, not an unmeasurable
  third-party wrapper.
- Ensure the focused input belongs to the scroll view and has completed layout.
- Check that `enabled` is true and the behavior is `smart` or `scroll`.
- If a custom input wrapper delays focus, call `refresh()` from
  `useFocusedInput` after its layout settles.

## A sticky submit button is behind the keyboard

Wrap the footer in `KeyboardAwareView` and set `position: 'absolute'` on that
component's style. The view then measures its bottom edge and moves above the
keyboard by the covered distance plus `keyboardSpacing`. Keep it outside the
scroll view and give the scroll content enough bottom padding to scroll above
the footer.

## Android content is moved twice

Use `adjustResize` as the standard window mode and avoid adding a second
keyboard-height spacer around the same content. The scroll view uses the event
screen coordinate where available, but unusual edge-to-edge or OEM keyboard
configurations may need a custom layout.

## Keyboard height is zero or unexpected

Hardware keyboards may not open a software keyboard. Floating and split
keyboards can occupy only part of the screen and do not have a useful full-width
height. Keyboard-reported heights can differ with navigation bars and OS
versions.

## Nested views add too much space

Use one keyboard-padding component per layout region. A nested aware view and
scroll view both respond to the same keyboard state; disable one with
`behavior="resize"` or `enabled={false}` when only one should adjust.

## The keyboard hides a modal field

Place the scroll view inside the modal content and verify the modal's measured
window frame. Presentation styles and window insets vary; test on the target
platform rather than assuming the main screen's coordinates apply to a modal.

## A navigation screen returns with stale keyboard spacing

The shared keyboard state is reset when its last subscriber unmounts and is
reconciled with `Keyboard.isVisible()` / `Keyboard.metrics()` when subscribers
mount or the app returns to the foreground. For stack screens that stay mounted,
pass the route's focus state to both aware components:

```tsx
const isFocused = useIsFocused();

<KeyboardAwareScrollView isFocused={isFocused}>...</KeyboardAwareScrollView>
<KeyboardAwareView isFocused={isFocused}>...</KeyboardAwareView>
```

`useIsFocused` comes from React Navigation; the toolkit itself does not require
that package. Verify the lifecycle manually:

1. Open the navigation regression demo, focus the Screen A input, and wait for
   the scroll padding and sticky action to move.
2. Press **Dismiss + open Screen B**, then **Go back to Screen A** without
   focusing another input. The keyboard height and spacing should be zero.
3. Repeat with a rapid navigation press and, on iOS, a cancelled swipe-back.
4. Background and foreground the app while the keyboard is open; verify offsets
   reflect the keyboard state after returning.
5. Rotate the device or resize an Android split-screen window and check that
   layout measurements are recalculated.
