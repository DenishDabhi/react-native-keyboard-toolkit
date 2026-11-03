# iOS testing

The library consumes iOS keyboard frame-change events and uses
`measureInWindow` for the focused field and its scroll viewport. The intersection
of those measured window coordinates with the keyboard frame determines the
temporary scroll range, so safe-area-constrained viewports do not blindly add
the full keyboard height. The library does not set safe-area, navigation, or
modal presentation configuration.

## Device checklist

- Test iPhone and iPad layouts with safe areas and the home indicator.
- Verify navigation headers and bottom tab bars are outside the measured form
  region or included in its layout.
- Test multiline inputs, interactive keyboard dismissal, and modal screens.
- On iPad, test floating and split keyboards where available.
- Test hardware keyboard attachment and focus transitions.
- Check input behavior during navigation animations.

Floating/split keyboards and transition-time measurements may not describe one
contiguous obscured area. Automated unit tests cannot validate native keyboard
geometry; test on actual simulators/devices before release.
