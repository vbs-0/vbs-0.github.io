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

## Assets

- Screenshots and logos come from the owner's public repositories, recorded in `src/assets/projects/provenance.json`
  with repository, path, date and SHA-256.
- Still images of the 3D scenes (`src/assets/posters/`) are rendered from the development viewer and
  shipped as the no-WebGL fallback; they carry the same provenance rule: produced by `npm run posters`.
- Icons are authored line glyphs in `src/lib/icons.ts`, one stroke weight, on a 24 by 24 grid.
