# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] – 2026-10-09

### Added
- Localization: English, German and Spanish, including help texts, error messages,
  the step display and the change list. The language defaults to the browser language
  and can be switched in the top-right corner (stored in the browser).
- Default macro comments follow the selected language (as long as the macros were not edited).
- README: technical chapter and this changelog.

### Changed
- README translated to English.

## [1.0.0] – 2026-10-09

First public release.

### Added
- Cube net of the Maltese Gear Cube with corners, gears, edges and centers.
- Simulation model: 2×2-style half turns with a middle ring turning 45° along
  (Mixup behaviour) and gears that advance and spin 90° per quarter turn.
- Move notation with modifiers (`R'`, `R3`, `U'2`), groups (`(…)3`) and whole-cube rotations (`x y z`).
- Three nets side by side: Before, Step and After, with stepping, playback and keyboard control.
- Highlighting of changed pieces and a change list with permutation cycles,
  gear spin and corner twist.
- Editable macros with defaults from a known solution guide (`A`, `C`, `XL`, `XR`, `XB`, `W`, `J`, `K`, …),
  automatic inversion, repetition and nested macros.
- Face graphics traced from a photo of the real puzzle (corner stars, asymmetric gears),
  hollow corners, optional helper marks.
- Solved colors as on the original: U white, D yellow, F green, B blue, L red, R purple.
- Light/dark theme and responsive layout.
