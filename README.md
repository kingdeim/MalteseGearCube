# Maltese Gear Cube – Move Sequence Explorer

A local web app (a single HTML file, no build step, no dependencies) that shows
Meffert's Maltese Gear Cube as a cube net and lets you step through move sequences,
comparing **Before / Step / After**.

**Online:** https://kingdeim.github.io/MalteseGearCube/
**Local:** open `index.html` in any browser.

Available in **English, German and Spanish** – picked from your browser language,
switchable in the top-right corner.

## Features

- Three cube nets side by side: starting position, current step, result
- Step with buttons, arrow keys or "Play"; the middle ring of the next move is shown dashed
- Changed pieces are highlighted in the result, plus a list of cycles
  (gears with their own rotation, corners with twist, edges & centers)
- Macros (e.g. `W`, `J`, `K`, `A`, `C`, `XL`, `XR`, `XB`) – editable and stored in the browser
- Invert a sequence, optionally expand macros into single moves
- Face graphics traced from a photo of the real puzzle (corner stars, asymmetric gears)
- **3D view** with animated moves: switch the Step panel between "Net" and "3D";
  "Next ▶" and "Play" animate every quarter turn (half 90°, middle ring 45°, gears spinning).
  Drag to rotate, scroll to zoom, double-click to reset the view.

## Notation

| Input | Meaning |
|---|---|
| `R L U D F B` | quarter turn of that half, clockwise |
| `R'` | counterclockwise |
| `R3`, `R4`, `U'2` | number of quarter turns |
| `(R4 U R4 U')3` | group with repetition |
| `x y z` | whole-cube rotation |
| `W`, `J'`, `A` … | macros (`'` inverts, a number repeats) |

Naming: gear `UF` = on the U face, towards F; edge `UF` = between U and F; center `U`.

## Mechanism model

Reconstructed and checked against the algorithms of a well-known solution guide:

- A quarter turn rotates one half of the cube by 90°, like a 2×2.
- The middle ring between the halves (4 centers, 4 edges, 8 gears) turns 45° along,
  like a Mixup cube – so `R4` is not the identity, and centers and edges can swap places.
- Gears in the ring advance one position and spin 90° about their own axis.

Solved colors: U white, D yellow, F green, B blue, L red, R purple.

## Technical details

### Structure

| File | Content |
|---|---|
| `index.html` | markup, CSS and the main script (simulation, parser, 2D rendering, UI) |
| `cube3d.js` | 3D view and move animation (`Cube3D.mount/show/play`) |
| `lib/three.min.js` | [three.js](https://threejs.org) r158, classic (non-module) build, MIT – see `lib/three.LICENSE` |

All files are plain classic scripts (no ES modules, no build step, no external requests),
so the app works offline by double-clicking `index.html` as well as on GitHub Pages.
The only change to the vendored three.js file is the removed deprecation warning at the top.
The main script in `index.html` is organised in sections:

| Section | Purpose |
|---|---|
| i18n | `I18N` dictionary (`de`, `en`, `es`), `t(key, vars)` lookup, `applyLang()` for `data-i18n*` attributes |
| Vector/matrix helpers | dot/cross products, 3×3 matrices, `rot(axis, deg)` (Rodrigues) |
| Geometry | face vectors, net layout (`FRAME`, `NETPOS`), slot definitions (`SLOTS`) |
| Moves | `quarter()`, `wholeRot()`, `applyStep()` – the puzzle simulation |
| Macros & parser | `parseMacroText()`, `parse()`, `expandMacro()`, `invertStep()` |
| Evaluation | `index()` (slot → piece), `signature()`, `gearQuarter()`, `cornerTwist()` |
| SVG rendering | `render()` plus the traced shapes `STAR_TL` and `GEAR_PATH` |
| Diff | `cycles()` and `describeDiff()` for the change list |
| UI | event handlers, stepping, playback, local storage |

### State model

Coordinates: x = R, y = U, z = F; the cube spans −1…1. A state holds three piece lists:

- **Corners** (8): position `pos` (±1, ±1, ±1) and rotation matrix `R` relative to the solved state.
- **Edges & centers** (18, interchangeable like on a Mixup cube): slot direction `dir`
  (a face normal or a normalised edge direction) and rotation matrix `R`.
  Rotations include 45° steps, so `R` is kept in floating point.
- **Gears** (24): face `f`, direction `d` towards the touching face (the slot name is
  `f` + `d`, e.g. `UF`) and an orientation vector `P` in the face plane (solved: `P = d`).

### Move simulation

A clockwise quarter turn of face *n* (`quarter(st, face, sense)`):

1. Everything strictly inside the turning half (`p·n > 0`) rotates 90° about *n*.
2. Edges/centers in the middle ring (`p·n = 0`) rotate 45° in the same direction
   and are snapped to the nearest slot – this is the Mixup behaviour.
3. Gears in the ring move one ring position (on-face gear ↔ gear on the next face), their
   orientation vector is transported along the ring and then spun by `GEAR_SPIN`
   (−90°, i.e. clockwise seen from outside for a clockwise move).

Counterclockwise moves use the opposite sense; `R'` is therefore **not** the same as `R3`.
`x y z` rotate all pieces rigidly without spinning gears.

The model was validated against the published solution algorithms, e.g. `W = (R4 U R4 U')3`
swaps the F/B centers and the RF/LB edges and turns U and D by 90°, `(J)4` produces the
documented gear 3-cycles, and `(U L'2 W L2 U' B4)2` cycles the centers L → F → R.

### Parser and macros

`parse()` turns text into steps `{label, moves[], macro?}`, where `moves` are single
quarter turns `{face, prime}`. Supported: modifiers in any order (`R2'`, `R'2`), curly
apostrophes, groups with repetition (`(…)3`, `(…)*3`) and macros (longest name match).
`X'` uses an explicit `X'` definition if present, otherwise the inverted expansion of `X`.
Recursive macros are detected and reported.

### Rendering

Each face is drawn in local coordinates (−1…1) inside an SVG group. Corner stars and gears
use paths that were traced automatically from a frontal product photo: the four symmetric
copies on one face were overlaid (majority vote) to cancel perspective, contoured with
marching squares, simplified (Ramer–Douglas–Peucker) and smoothed at runtime
(`smoothPath()`). Gears are drawn rotated by their orientation vector `P`.

Edge and center stickers are split into small cells; each cell's 3D point is rotated back
with the piece's `R⁻¹`, and the dominant axis of the result picks the colour. That is how
an edge sitting in a center slot (or vice versa) shows two colours, as on the real puzzle.

Changed pieces are found by comparing `signature()` of the before and after states;
`describeDiff()` reports permutation cycles with gear spin (in 90° steps) and corner twist.

### 3D view and animation (`cube3d.js`)

The 3D scene is rebuilt from the simulation state, piece by piece: each corner is an
octant-shaped body (built from grid cells) with the hollow corner cut out and a notch next to
each edge stone, plus its three star stickers, leaving the three middle rings free; gears are thin extruded plates using the traced outlines (three.js
`ExtrudeGeometry`, quadratic curves through the smoothed points). A fixed black sphere
represents the core. Every piece is its own `THREE.Group`, so a move can transform it freely.

Edges and centers are rigid pieces inside the middle ring: a center is a column, an edge is a
small head at the cube edge connected to the core by a diagonal stem of the same cross-section.
Each one is built in its solved
pose (with its stickers) and then transformed by its rotation matrix `R` from the simulation.
So an edge sitting in a center slot sticks out of the face as a ridge, and a center sitting
in an edge slot lies recessed – exactly like on the real puzzle. (The 2D net shows the same
situation as a two-coloured sticker.)

A step is animated one quarter turn at a time. For each quarter turn the state before and
after is known, and every piece gets a motion function of t ∈ [0, 1]:

- pieces in the turning half (and all pieces for `x y z`) rotate rigidly by 90°,
- edges and centers in the middle ring rotate by 45°,
- ring gears travel around the axis from their start to their end position while their
  orientation is interpolated (quaternion slerp) – this shows the 90° spin.

After the last quarter turn the scene is rebuilt from the final state. Rendering is on demand
(only while animating or when the view changes); the camera is a small orbit control written
for pointer events, so it works with mouse and touch.

### Persistence and debugging

`localStorage` keys: `mgc` (setup and sequence), `mgcMacros` (edited macros), `mgcView` (net or 3D) and
`mgcLang` (language). All access is wrapped in `try/catch`, so the app also runs where
storage is blocked. For experiments in the browser console, `window.MGC` exposes
`solved`, `parse`, `applySteps`, `index` and `describeDiff`, e.g.:

```js
MGC.describeDiff(MGC.solved(), MGC.applySteps(MGC.solved(), MGC.parse("W")))
```

### Adding a language

Copy one block of the `I18N` object (e.g. `en`), translate the values, keep the `{placeholders}`
and add an `<option>` to the `#lang` select.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT – see [LICENSE](LICENSE).
