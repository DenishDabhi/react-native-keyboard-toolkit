# Changelog

All notable changes to this project are documented here.

## 1.0.1 - 2026-11-05

- Fix absolutely positioned `KeyboardAwareView` footers remaining behind the
  keyboard; animate them above the keyboard and restore their position on hide.
- Update the demo with a scrollable form and a bottom-sticky submit action.
- Add sticky footer regression tests and clarify platform/layout guidance.
- Rewrite the README with concise installation, form, sticky button, and API
  examples.

## 1.0.0 - 2026-11-04

- Added keyboard-aware scrolling, view layout adjustment, toolbar navigation,
  dismissal controls, and shared keyboard hooks for iOS and Android.
- Added public imperative ref types for both keyboard-aware components.
- Added platform event, focus, component-ref, and lifecycle tests.
- Documented installation, APIs, platform behavior, and device testing guidance.
- Initial release candidate with keyboard-aware views and scrolling.
- Added shared keyboard state and animation/focus hooks.
- Added toolbar and keyboard dismissal components.
- Added local React Native demo, tests, and platform guidance.
