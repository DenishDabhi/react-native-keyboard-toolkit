# Troubleshooting

## The focused field does not scroll

- Confirm the input is a native React Native `TextInput`, not an unmeasurable
  third-party wrapper.
- Ensure the focused input belongs to the scroll view and has completed layout.
- Check that `enabled` is true and the behavior is `smart` or `scroll`.
- If a custom input wrapper delays focus, call `refresh()` from
  `useFocusedInput` after its layout settles.

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
