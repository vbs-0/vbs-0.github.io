# Design

As built, 2026-11-27. Three versions share one content source and one 3D foundation; each has its own
world. Colours are authored in OKLCH in `src/styles/palettes.ts` and shipped as `--c-*` custom properties;
the three.js scenes read the same values.

## Shared

- **Type scale:** a display size per version (fluid, `clamp`), a heading, a body and a small annotation size.
  Body measure is capped between 60 and 68 characters. Numerals are tabular wherever numbers sit in columns.
- **Motion:** one authored moment per version (the teardown, the drawing itself, the opening stack).
  Everything else is short and functional. Durations come from a single `--motion` multiplier in About phone
  (the Developer options switch) and from `prefers-reduced-motion` everywhere.
- **Browser surfaces:** selection, caret, scrollbars and focus rings are themed per version.
- **Floor:** one `h1`, a skip link, visible focus, 44 px touch targets, AA contrast checked by unit test,
  no sideways scrolling from 320 px, a print stylesheet that drops the 3D.

## About phone (`/phone/`)

- **World:** a custom-ROM Settings screen where the device is the person. Grouped list cards with a large
  outer radius and small inner radii, state layers on rows, a collapsing large title, switches and snackbars.
- **Colour:** one green-teal seed at hue 158. Light: near-white cards (`#fafdfb`) on a mint-tinted ground
  (`#e3f1e8`); dark: `#161e19` cards on `#0a100c`. Primary `#00633c` in light, `#7ae4aa` in dark.
  Tertiary is a warm coral (`#a73b15` / `#ffae85`) for badges and status only.
- **Type:** Roboto Flex, variable width and weight. The page title is wide and heavy (width 122%, weight 620);
  rows are regular width. Roboto Mono only for build numbers and measured values.
- **Components:** row (icon, label, sub-label, end value), group card, chip, tag, filled and tonal buttons,
  toggle switch, select, snackbar, full-screen search dialog.
- **3D:** the procedural phone in PBR materials (glass, brushed frame, PCB with drawn traces, battery label,
  iridescent lens glass), lit by a studio environment and one key light. Its display is a live canvas that
  mirrors the page or shows the open app's screenshot.
- **Signature:** seven taps on Build number unlock Developer options that really work: layout bounds,
  GPU overdraw, HWUI frame profile, RTL, animator duration scale.

## Service manual (`/manual/`)

- **World:** a technical drawing. A bordered sheet per section with centring marks and a title block
  (title, drawn, date, sheet n of 6, scale), numbered balloons with leader lines, dimension lines, a
  revision table, approval stamps.
- **Colour:** whiteprint in light: ink `#162644` on drafting white `#f8fafd`, construction lines `#358bc1`.
  Blueprint in dark: pale ink `#edf5fb` on Prussian blue `#0d2c59`. One highlighter yellow `#feed25` marks
  the active part and the primary action.
- **Type:** Archivo, variable width. Display and sheet titles are condensed (width 62 to 66%) and heavy;
  body is regular width. Chivo Mono for part numbers, dimensions and table heads, always uppercase with
  slight tracking.
- **Components:** sheet, title block, balloon, leader line, parts list row, figure plate, dimension line,
  stamp, revision table, contribution calendar, language bars.
- **3D:** the same phone drawn as ink lines: flat fills with hidden-line removal, crease edges, and
  silhouette lines that appear only where a curved surface turns away. Orthographic camera; the drawing
  draws itself once, top to bottom, then comes apart as the visitor scrolls, one part per step.
- **Signature:** the scroll-driven exploded view; balloons and rows select each other both ways.

## Classic (`/classic/`)

- **World:** the familiar dark developer portfolio, finished properly. A sticky translucent nav, a hero with
  one centrepiece, sections with generous space, a work list that alternates sides.
- **Colour:** blue-black studio `#070a13`, surfaces `#101421` and `#1b2130`, text `#eef0f6`, one warm gold
  accent `#edca71`. Six layer colours run the tempering scale, from straw through bronze and plum to steel:
  `#eccf75`, `#ec9c5c`, `#ee7d8d`, `#b386e4`, `#6aa7f4`, `#97def0`.
- **Type:** Mona Sans, variable width. Display is expanded and heavy (width 118%); body regular. Monaspace
  Neon for values and code-like data only.
- **Components:** pill buttons (gold filled and outline), filter chips, layer accordion with a colour dot,
  metric grid, project block with screenshots and limits, timeline, contribution calendar and language bars.
- **3D:** six iridescent glass slabs, one per layer, stacked and turned; they open as the visitor reaches
  the stack section and the selected slab lifts and glows. A second scene raises a skyline from the
  contribution calendar, one bar per day, height by count, colour by level.
- **Signature:** the stack is the index: choosing a slab opens its layer and filters the work below.

## Motion

One motion system, three voices. Everything animates `transform`, `opacity` or a view transition; nothing animates layout, filters or shadows.

- **The sweep between builds** (`src/lib/motion/sweep.ts`, `src/styles/motion.css`): seven bands slide in from the right, one every 14 ms, in two alternating tones of the destination's paper; three blades in its accent cross faster; one flash leads. The screen is covered at 280 ms and the page navigates. The destination paints covered (its head script reads a flag) and the bands leave to the left over 300 ms, with the build's name and one line about it riding across. Each build skins the sweep in its own colours and lettering. The destination is prefetched on hover or focus, so the swap happens under the cover.
- **The theme flood** (`src/lib/motion/flood.ts`): a disc in the new theme's colour grows from the switch, the theme flips underneath it and the disc is removed in the same frame. One composited layer.
- **Morphs** (`src/lib/motion/view-transition.ts`): an App info page takes its icon and name from the list row it was opened from; filtering the work moves the projects that stay to their new places. Both use the browser's view transitions, and both clear their names afterwards.
- **Scroll reveals** (`src/lib/motion/reveal.ts`): one observer, transform and opacity, 70 ms apart in a group. Elements are only hidden once the module is running, so nothing is ever lost.
- **Arrivals:** the drawing draws itself (manual), the device rises and settles (phone), the stack rises into place (classic).
- **The interaction kit** (`src/lib/motion/fx.ts`): one scanner, driven by attributes, everything transform or opacity. `data-split` wraps a heading's words in overflow masks and lets them rise in one after another (the sheet titles in the manual, the name in the others); `data-scrub` lights a paragraph word by word as it crosses into reading position, used only below the fold; `data-countup` counts a measured number up from zero the first time it is visible, and never blanks the real value if the observer cannot fire; `.btn` and `data-magnetic` pull a control towards the pointer with a short massed ease; `data-shot` floats the project's real screenshot next to the cursor on desktop. The classic also carries the six layers as a slow marquee belt and a film-grain layer stepped on the compositor; the phone's device turns a few degrees towards the pointer and wears its disciplines as a ring of circular type. Count-up and scrub keep their content readable when JavaScript or observers never run; reduced motion removes all of it.
- **The budget** (`src/lib/three/engine.ts`): the median of the last 60 frame intervals is checked every 60 frames. Above 22 ms the drawing buffer shrinks to 70%, then the scene drops to simpler materials and loses its idle motion, then it renders on demand only. Scenes stop rendering when their slot leaves the screen, and the 3D boots only after the sweep has left.
- **Off:** reduced motion removes the sweep, the flood and the reveals; the `data-motion="off"` switch (About phone's animator scale) does the same.

## Assets

- Screenshots and logos come from the owner's public repositories, recorded in `src/assets/projects/provenance.json`
  with repository, path, date and SHA-256.
- Still images of the 3D scenes (`src/assets/posters/`) are rendered from the development viewer and
  shipped as the no-WebGL fallback; they carry the same provenance rule: produced by `npm run posters`.
- Icons are authored line glyphs in `src/lib/icons.ts`, one stroke weight, on a 24 by 24 grid.
