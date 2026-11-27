# Portfolio, three ways: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one static site with three complete versions of vbs's portfolio (`/phone/`, `/manual/`, `/classic/`), all fed by one content source, each with its own three.js scene.

**Architecture:** Astro renders every version to static HTML from typed content in `src/content`. Shared code in `src/lib` knows nothing about any version. Each version lives in `src/variants/<id>/` and loads its three.js scene with a dynamic import after first paint.

**Tech Stack:** Astro 7.4.13, TypeScript 6.0.3, three.js 0.187.0, vitest 5.1.1, Playwright 1.65.1 (installed Edge), axe-core, sharp, Fontsource variable fonts, GitHub Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-27-portfolio-three-ways-design.md` (product truth: `PRODUCT.md`).

This plan is executed inline by its author in the same session. Steps therefore name files, interfaces, tests and commands; the code itself lives in the commits, not in this file.

## Global Constraints

- Node >= 22.23.4. Dependencies pinned exactly; nothing published less than seven days before install.
- Push only to `vbs-0/vbs-0.github.io`. Commit messages end with `Authored-By: vbs-0` and carry no tool attribution.
- Public facts come only from the résumé, the owner's READMEs, the public GitHub API, and the four owner approvals in `PRODUCT.md`.
- A version imports only from `src/content`, `src/lib`, `src/styles/palettes.ts`, `src/components/shared`. Never from another version.
- The page must be complete without WebGL, without JavaScript and with reduced motion.
- Text contrast >= 4.5:1 (large text >= 3:1), touch targets >= 44 px, no horizontal scroll from 320 px.
- No third-party requests at runtime. Fonts are self-hosted, latin subset.
- Verification command for every task: `npm run verify` (astro check, vitest, build).

---

### Task 1: Tooling, colour and formatting

**Files:**
- Create: `astro.config.mjs`, `tsconfig.json`, `site.config.ts`, `vitest.config.ts`, `src/env.d.ts`
- Create: `src/lib/color.ts`, `src/lib/format.ts`, `src/styles/palettes.ts`
- Test: `tests/unit/color.test.ts`, `tests/unit/format.test.ts`, `tests/unit/palettes.test.ts`

**Interfaces:**
- Produces: `oklch(l: number, c: number, h: number): string` (hex), `contrast(a: string, b: string): number`, `hexToRgb(hex): [number, number, number]`
- Produces: `formatBytes(n): string`, `formatInt(n): string`, `formatMonthYear(iso): string`, `formatDateISO(iso): string`
- Produces: `palettes: Record<VariantId, Record<'light' | 'dark', Palette>>` and `cssVars(p: Palette): string`

- [ ] Write `tests/unit/color.test.ts`: `oklch(1,0,0) === '#ffffff'`, `oklch(0,0,0) === '#000000'`, `contrast('#000','#fff') === 21` (within 0.01).
- [ ] Write `tests/unit/palettes.test.ts`: for every version and theme, each declared text/background pair meets 4.5:1, each large-text pair 3:1.
- [ ] Run `npm test` and see both fail, then implement and see them pass.
- [ ] Commit.

### Task 2: Content, résumé and screenshots

**Files:**
- Create: `src/content/{types,profile,experience,education,recognition,layers,projects,index}.ts`
- Create: `scripts/fetch-screenshots.mjs`, `src/assets/projects/*`, `src/assets/projects/provenance.json`
- Create: `public/resume/Veerabhadra-Swami-Challagali-Resume.pdf`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces: `profile`, `experience`, `education`, `certifications`, `hackathons`, `layers: Layer[]`, `projects: Project[]`, `featured`, `mlProjects`, `moreProjects`, `projectById(id)`, `layerById(id)`, `projectsForLayer(id)`
- Types as written in section 4 of the spec.

- [ ] Write `tests/unit/content.test.ts`: unique project ids; every project has >= 1 link with an https URL; every featured project has >= 1 metric and >= 1 highlight; every `layer.projectIds` entry resolves; every project lists >= 1 layer; all six layers and six phone parts appear exactly once; no banned repository (`bomber`, `commit-hygiene`) appears; phone and email match the résumé values.
- [ ] Implement the content files from the résumé and the READMEs.
- [ ] Run `node scripts/fetch-screenshots.mjs`; confirm every image decodes and `provenance.json` lists it.
- [ ] `npm test` passes. Commit.

### Task 3: GitHub snapshot

**Files:**
- Create: `scripts/sync-github.mjs`, `scripts/lib/contrib.mjs`, `src/data/github.json`, `src/lib/github.ts`
- Test: `tests/unit/contrib.test.ts`, `tests/unit/github.test.ts`, `tests/fixtures/contrib.html`

**Interfaces:**
- Produces: `parseContributions(html: string): { date: string; count: number; level: 0|1|2|3|4 }[]`
- Produces: `github.user`, `github.repos`, `repoByName(full)`, `languagePresence(): { name: string; repos: number }[]`, `contribWeeks(): Day[][]`, `contribTotal`, `fetchedAt`

- [ ] Fixture test: `parseContributions` on a trimmed real calendar returns the expected days, counts and levels; an empty string returns `[]`.
- [ ] `github.test.ts`: the committed snapshot has >= 300 days, sorted, and every `Project.repos` entry exists in it.
- [ ] Run `npm run sync:github` once and commit the snapshot.

### Task 4: Shared page shell

**Files:**
- Create: `src/components/shared/{BaseHead,Icon,Shot,OtherBuilds,SkipLink}.astro`, `src/lib/icons.ts`, `src/lib/search.ts`
- Create: `src/pages/404.astro`, `public/{favicon.svg,robots.txt,site.webmanifest}`, `src/assets/og/*.png`
- Test: `tests/unit/search.test.ts`

**Interfaces:**
- Produces: `<BaseHead variant title description />` (meta, canonical, Open Graph, JSON-LD Person, theme script)
- Produces: `buildSearchIndex(): SearchEntry[]`, `search(index, query): SearchEntry[]`

- [ ] `search.test.ts`: "django" finds Experience; "rust" finds ClipBridge and Notepad; an empty query returns nothing; matching ignores case.

### Task 5: 3D foundation and the phone

**Files:**
- Create: `src/lib/three/{engine,capabilities,scroll,math,slots}.ts`
- Create: `src/lib/three/phone/{dimensions,shapes,parts,build,screen}.ts`
- Create: `src/lib/three/lines/{edges,fat-lines}.ts`
- Test: `tests/unit/math.test.ts`, `tests/unit/edges.test.ts`, `tests/unit/phone.test.ts`

**Interfaces:**
- Produces: `createEngine(canvas, opts): Engine` with `onFrame(cb)`, `invalidate()`, `setSize()`, `dispose()`
- Produces: `detectCapabilities(): { webgl: boolean; reducedMotion: boolean; tier: 'high' | 'low' }`
- Produces: `buildPhone(): PhoneModel` with `parts: Record<PartName, PhonePart>`, `setExplode(t: number)`, `anchorWorld(part): Vector3`
- Produces: `extractEdges(geometry, thresholdDeg): { creases: Float32Array; conditional: Float32Array; controls: Float32Array }`
- Produces: `class FatLines extends Mesh` with `setResolution(w, h)`, `lineWidth`, `color`, `reveal`

- [ ] `edges.test.ts`: a box yields 12 crease edges and 0 conditional edges; a cylinder with 24 segments yields 48 creases (two rims) and 24 conditional edges; a plane yields 4 boundary edges.
- [ ] `math.test.ts`: `damp`, `clamp01`, `smoothstep`, `remap` at their boundaries.
- [ ] `phone.test.ts`: `buildPhone()` exposes all six callout parts; exploded positions differ from assembled ones; the assembled bounding box matches `dimensions.ts`.

### Task 6: Version A, About phone

**Files:**
- Create: `src/variants/phone/Page.astro`, `components/*.astro`, `styles/*.css`, `client/{main,router,search,theme,devopts,toast,scene,screen-ui}.ts`
- Create: `src/pages/phone/index.astro`
- Test: `tests/e2e/phone.spec.ts`

- [ ] Static page first: all sections render with JavaScript off; check at 360, 768, 1440.
- [ ] Client behaviour: theme, collapsing title, search, App info routing with focus handling, Build number unlock, Developer options.
- [ ] Scene: PBR phone following slots; hero, hardware teardown, app states; pointer rotation; fallback still.
- [ ] e2e: no console errors; search finds a project; `#/apps/studease` opens and Escape returns focus; seven activations of Build number reveal Developer options; WebGL-off shows the still image; axe reports no violations.

### Task 7: Version B, Service manual

**Files:**
- Create: `src/variants/manual/Page.astro`, `components/*.astro`, `styles/*.css`, `client/{main,theme,stage,scene,callouts}.ts`
- Create: `src/pages/manual/index.astro`
- Test: `tests/e2e/manual.spec.ts`

- [ ] Static sheets first, then the ink-line scene with orthographic camera, draw-in, scroll-driven explode, balloons and leader lines.
- [ ] e2e: balloons are reachable by keyboard and select the matching parts-list row; theme switch changes the paper; WebGL-off shows the still drawing; axe reports no violations.

### Task 8: Version C, Classic

**Files:**
- Create: `src/variants/classic/Page.astro`, `components/*.astro`, `styles/*.css`, `client/{main,filter,scene,stack,skyline}.ts`
- Create: `src/pages/classic/index.astro`
- Test: `tests/e2e/classic.spec.ts`

- [ ] Static page first, then the glass stack, the layer filter and the contribution skyline.
- [ ] e2e: choosing a layer filters the work list and announces the count; WebGL-off shows the still image; axe reports no violations.

### Task 9: Root, switcher, fallbacks, print

**Files:**
- Create: `src/pages/index.astro` (default version), `scripts/capture-posters.mjs`, `src/assets/posters/*`
- Modify: each `Page.astro` (other-builds links, poster wiring, print styles)
- Test: `tests/e2e/shared.spec.ts`

- [ ] e2e for every version: no horizontal overflow at 320 px; content present with JavaScript disabled; reduced motion stops idle motion; all external links resolve to https and open safely; the résumé PDF downloads.

### Task 10: Review, document, deploy

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`, `AGENTS.md`, `DESIGN.md`

- [ ] Two batched screenshot rounds (desktop and phone, every version); fix between them.
- [ ] `impeccable detect --json` once on the built pages; fix what is mechanical.
- [ ] Finish review against the direction contracts; write `DESIGN.md`.
- [ ] `npm run verify` and `npm run test:e2e` clean. Commit.
- [ ] Create the repository, push `main`, set Pages source to GitHub Actions, confirm the live site answers 200 on all four addresses.
