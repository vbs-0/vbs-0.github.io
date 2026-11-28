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

## System map (`/graph/`)

- **World:** the work as one chart you read. Every layer, project and tool is a node in a 3D field; six
  planes of depth hold the six layers; the camera flies to whatever you pick. No phone, no film, no page
  of prose first: it is a map, and the command palette is how you move through it.
- **Colour:** a deep chart ground `#0b1018`, one signal cyan `#5fe3d0` for anything you can act on, and
  the six layer hues as the only other colour. Nothing else is tinted.
- **Type:** Archivo, condensed and heavy, for the wordmark and headings; Chivo Mono for every label,
  count and hint. Both already shipped with the site.
- **Composition:** a bar (wordmark, find, contact), the chart filling everything left of a fixed panel,
  the panel carrying whatever is selected, and the layer chips along the bottom. Below the fold the same
  facts as plain rows, then contact.
- **The chart:** nodes are HTML buttons riding on projected 3D positions, so the map is keyboard-first and
  readable by a screen reader; three.js draws the edges, a ring at each layer and the dust, and owns the
  camera. Without WebGL the same coordinates are drawn as an isometric SVG in the HTML.
- **Signature:** the palette (`⌘K`, `/`, or the bar) searches every node and action by name and opens it
  on the map, and the camera flight from node to node.

## Film (`/` and `/film/`)

- **World:** the opening titles of a film about one engineer. The countdown opens on an illustrated
  mountain pass, with the name to the left of the sun and watchtower. Play first scene returns to the
  same viewpoint by moonlight. The camera moves into the product layers after that establishing pair;
  a reel of measured projects, credits and an end card follow.
- **Colour:** projection black `#0f0e0d` and title white `#f6f1e8`, and one grade per scene, never two at
  once: display azure `#67b8ee`, antenna violet `#b891f5`, board green `#6ad895`, lens rose `#ec8fbe`,
  silicon amber `#f2c14e`, battery ember `#f0956a`. The grade tints the set's rim light, the scene's slug,
  the strip segment and the project's accent. The cut has its own material: gold airborne pigment and
  vermilion cloth with a dark cut-block maker's seal.
- **Type:** League Gothic for every title card (condensed, uppercase, 0.86 to 0.92 leading, up to 13rem),
  Jost for body and credits, Courier Prime for sluglines, timecode and measured values. All self-hosted.
- **Composition:** a fixed top bar (mark, live scene name, contact) and a fixed bottom bar (the film's acts
  as a scrubber, the playhead, a running timecode). Nothing scrolls the chrome; the picture moves behind it.
- **The set:** the same procedural phone, lit cinematically rather than as a studio product shot: a key that
  travels with the camera, a rim in the scene's grade, a soft pool of that grade behind the subject, and
  ACES tone mapping. The camera dives to each part in turn, blending between neighbouring shots as you scroll.
- **Signature:** a bank of dust obscures the ridge; three overlapping standards pass close to the lens.
  The scene link moves scroll, focus and the set together on the opaque frame, before the cloth parts.
  A native scroll edits the exposure without moving focus. Further scene choices during cover replace
  the pending destination; they never queue a string of wipes.
- **Project pages** (`/work/<id>/`): one page per project in the same world: the headline number rolling,
  the whole scene, every metric with its source, the stack, the stated limits and all the shots.
- **Details:** a vbs cameo hidden in every act (finding them all opens a director's HUD with live frame
  statistics), a film-grain layer, autofocus brackets that lock onto whatever can be pressed, and
  "alternate cuts" linking the three earlier builds.

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

One motion system, four voices. Everything animates `transform`, `opacity`, a clip or a view transition;
nothing animates layout, filters or shadows.

- **The countdown leader** (`src/variants/film`): a 1.3 s count from 8 that runs on the compositor while the
  3D boots behind it, then one bright frame and the leader opens as a letterbox. It plays once per visit,
  never after a sweep, on a deep link, for automation or with reduced motion, any key or click skips it, and
  the head script decides before first paint so the page never flashes behind it. If the page script never
  runs, a timer in the head takes it away.
- **The director:** scroll positions are measured once per layout change and read from cache each frame, so
  a scroll frame writes a transform, a few attributes and a timecode. The camera's shot index is continuous
  (0 is the title, 1 to 6 the layers) and the rig, the camera and the grade all blend between neighbours.
- **The reel:** sideways on wide screens, pinned and driven by scroll; a frame is graded until it is in
  focus and its counter rolls when it arrives. On phones it is a column, which is the honest layout there.
- **Wheel smoothing** (Lenis, 1.3.27) on desktop only, native touch, and off with reduced motion. The Film
  cut uses one 470 ms cover and 570 ms release; only opacity and transforms animate. No live particles,
  extra WebGL context or video decoder. If the cloth fails to decode, the link still lands immediately.

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
- Film art (`src/assets/film/`): `day.webp` and `night.webp` are original registered prints of one ridge,
  stone causeway and watchtower. `dust.webp` is a seeded pigment matte; `standard.webp` is a warp of an
  original seal, woven field and cut fringe. `npm run film:art` produces all four from local source. No
  frames, characters, lettering or audio were lifted from the reference film.
- Icons are authored line glyphs in `src/lib/icons.ts`, one stroke weight, on a 24 by 24 grid.
