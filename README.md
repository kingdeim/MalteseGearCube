# Maltese Gear Cube – Move Sequence Explorer

A local web app (a single HTML file, no build step, no dependencies) that shows
Meffert's Maltese Gear Cube as a cube net and lets you step through move sequences,
comparing **Before / Step / After**.

**Online:** https://kingdeim.github.io/MalteseGearCube/ (once GitHub Pages is enabled)
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

## License

MIT – see [LICENSE](LICENSE).
