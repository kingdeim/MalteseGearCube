# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.5.6] – 2026-10-25

### Fixed
- Phones: moves were shown only after a delay of several seconds and short steps like `R1` were
  not animated. The 3D scene is no longer rebuilt before and after each animation; rebuilds reuse
  cached piece shapes; Before/After nets and the change list are only redrawn when the sequence
  changes.

## [1.5.5] – 2026-10-23

### Fixed
- 3D: gears were partly hidden inside the cube while moving over an edge. The corner base now
  leaves a wide channel around the middle rings, the stars are flatter plates, and travelling
  gears dip slightly inwards on their way over the edge.

## [1.5.4] – 2026-10-23

### Fixed
- 3D: removed the square wall blocks of the hollow corner; the star arms and the base now form
  the hollow, so nothing square sticks out next to the rounded stars.

## [1.5.3] – 2026-10-23

### Changed
- 3D: only the corner stars keep the larger black body; gears, edges and centers have slim bodies
  again (centers slimmer than before).

### Fixed
- 3D: the walls of the hollow corner no longer stick out next to the star arms.

## [1.5.2] – 2026-10-23

### Changed
- 3D: the black bodies of corners and gears are about 2 mm larger than their coloured areas
  (outline grown via a raster to stay clean); edge heads are wider accordingly.

### Fixed
- 3D: gap between the star arms and the walls of the hollow corner.

## [1.5.1] – 2026-10-23

### Changed
- Star outline mirrored exactly at its diagonal, so the stars of neighbouring faces meet
  symmetrically at the cube edges (2D and 3D).
- 3D: corner bodies follow the star outline again; all coloured films (stars, gears, edges,
  centers) have a thin black rim. The hollow corner is lined with flat walls up to the surface.
- Version number shown next to the language selector.

### Fixed
- An error during an animation no longer freezes it; the final position is shown and the error
  message is displayed (to help find the missing animation on some phones).

## [1.5.0] – 2026-10-23

### Changed
- Navigation in quarter turns: "Next ▶" and "◀ Back" move one quarter turn (e.g. inside `R100`),
  the step display shows "quarter turn k/m of …"; the chips still jump to the start of a step.
- "Pause" stops at the quarter turn that is currently running.
- 3D: corner bodies are flush with the surface again, so all coloured stickers lie on one level;
  round pockets around the gears give tilted gears room. The hollow corner is a clean inverted cube.

### Fixed
- On phones, "Next ▶" on a long step like `R100` played the whole step like "Play".

## [1.4.1] – 2026-10-23

### Added
- "◀ Back" is animated as well (the step is played backwards).

### Changed
- 3D: all corners are built the same way – a flat base on one common level with the hollow
  corner cut out as a clean cube, plus equally high star prisms. No more offset edges in the
  hollow corners.

## [1.4.0] – 2026-10-23

### Added
- Speed slider for the animation (5 steps, remembered).

### Changed
- 3D: corner bodies follow the star outline, so they no longer cover the gears.
- 3D: gear axle tilt increased to 25°.
- Animation: pieces are built once per step instead of once per quarter turn; constant speed
  within a step (easing only at its start and end).

### Fixed
- Long steps such as `R100` were jerky or not animated at all; they now run smoothly.
- "Pause" and navigation now stop a running animation immediately (previously only after the
  whole step had finished).

## [1.3.1] – 2026-10-23

### Fixed
- 3D: edge stones are extruded as one piece (stem and head without a gap).
- 3D: gears have a black body and a stronger axle tilt (15°), so turned gears visibly stick out.
- Script URL carries a version parameter so browsers load the new 3D code instead of a cached one.

### Changed
- 3D: coloured stickers are now very thin films flush with the black bodies.

## [1.3.0] – 2026-10-23

### Added
- Mobile layout: the cube view is shown first, "Step / Before / After" become tabs on small
  screens, and the input, moves/changes and macro sections are collapsible (remembered;
  on phones only the input is open on the first visit).
- 3D: gears spin about a slightly tilted axle, so they stand tilted when turned by 90° or 180°.

### Changed
- Playback controls and the step list moved directly below the Step view.

### Fixed
- 3D: the stem of an edge stone now reaches the widest part of its head instead of touching it
  only at a thin point.

## [1.2.2] – 2026-10-09

### Changed
- 3D: edge stones are now a small head at the cube edge on a diagonal stem of the same
  cross-section (instead of a large block).
- 3D: corners are cut back next to the edge stones, so centers in edge positions are easier to see.

## [1.2.1] – 2026-10-09

### Fixed
- 3D: edges and centers are now rigid blocks that always stay one piece. They no longer leave
  the cube during the animation; an edge in a center slot protrudes as a ridge and a center
  in an edge slot lies recessed, as on the real puzzle.
- 3D: corner bodies leave the middle rings free; a fixed core fills the inside.

## [1.2.0] – 2026-10-09

### Added
- 3D view in the Step panel (toggle "Net" / "3D", remembered in the browser), built from the
  traced face graphics with hollow corners, lighting and an orbit camera (drag, scroll, double-click).
- Animated moves: "Next ▶" and "Play" animate each quarter turn – the turning half rotates 90°,
  the middle ring 45°, and the ring gears travel and spin. Long macros play faster.
- Bundled three.js r158 (`lib/three.min.js`, MIT) so the app still works offline without a server.

### Changed
- "Play" now waits for each animation to finish before moving on in the 3D view.
- Code split into `index.html` and `cube3d.js`.

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
