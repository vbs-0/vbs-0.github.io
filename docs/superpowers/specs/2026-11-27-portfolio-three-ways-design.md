# Portfolio, three ways: design

Date: 2026-11-27. Owner: Veerabhadra Swami Challagali (vbs). Product truth lives in `PRODUCT.md`; this file decides how it is built.

## 1. What is being built

One static site, three complete versions of the same portfolio. The owner picks a version per job application or event, so each version stands alone and has its own address.

| Address | Version | One line |
|---|---|---|
| `/phone/` | About phone | A custom-ROM Settings screen where the device is the person, with a live 3D phone |
| `/manual/` | Service manual | An exploded-view service drawing in ink lines, rendered in real 3D |
| `/classic/` | Classic | The familiar dark 3D portfolio, with an iridescent glass layer stack |
| `/` | default | Renders the version named by `defaultVariant` in `site.config.ts` |

Every version shows the same facts from one typed content source. A fact is edited once.

## 2. Decisions already made by the owner

- Hosting: GitHub Pages, new public repository `vbs-0/vbs-0.github.io`. That is the only repository this project may push to.
- Public information: mobile number, résumé PDF download, employer name (SkyLinx, product Emplinx), team-lead role.
- Stack: delegated. Astro 7 (static) + TypeScript + three.js 0.187, no UI framework in the browser.
- Versions: all three, end to end.

Decisions taken by the builder and reported to the owner: the lead role reads "one of two team leads on a nine-person team"; education shows degree and years only; `bomber`, `commit-hygiene` and forks are left out; no "open to work" line.

## 3. Architecture

```
site.config.ts                 default version, switcher on/off, site origin
src/content/                   the single source of truth (typed TypeScript)
  types.ts profile.ts experience.ts education.ts recognition.ts layers.ts projects.ts index.ts
src/data/github.json           snapshot written by scripts/sync-github.mjs (committed)
src/assets/projects/           real screenshots and logos from the owner's repositories
  provenance.json              source URL, fetch date and SHA-256 for every image
src/lib/                       shared code with no knowledge of any version
  color.ts format.ts github.ts search.ts
  three/engine.ts capabilities.ts scroll.ts math.ts
  three/phone/                 procedural phone: geometry, parts, screen texture
  three/lines/                 edge extraction and screen-space fat lines
src/styles/palettes.ts         every colour of every version (CSS and three.js read the same values)
src/components/shared/         BaseHead.astro, Icon.astro, Shot.astro, OtherBuilds.astro
src/variants/phone/            Page.astro, components, client scripts, styles
src/variants/manual/           same shape
src/variants/classic/          same shape
src/pages/index.astro          renders the default version
src/pages/{phone,manual,classic}/index.astro
src/pages/404.astro
scripts/sync-github.mjs        public GitHub data -> src/data/github.json
scripts/fetch-screenshots.mjs  repository images -> src/assets/projects/
scripts/capture-posters.mjs    still images of each 3D scene for fallbacks
public/resume/                 the résumé PDF
tests/unit/ tests/e2e/         vitest and Playwright
.github/workflows/deploy.yml   build, test, deploy to Pages; weekly data refresh
```

Rules that keep the three versions from drifting:

- A version may import from `src/content`, `src/lib`, `src/styles/palettes.ts` and `src/components/shared`. It never imports from another version.
- All copy that states a fact comes from `src/content`. A version only owns its labels and micro-copy.
- The three.js bundle is loaded with a dynamic import after first paint. The page is complete before it arrives.

## 4. Content model

`src/content/types.ts` defines the shapes. The important ones:

```ts
type LayerId = 'interface' | 'protocol' | 'services' | 'models' | 'system' | 'ops';
type PhonePartId = 'display' | 'antenna' | 'board' | 'camera' | 'soc' | 'battery';

interface Metric { value: string; label: string; source?: string }        // source = URL of the evidence
interface ProjectLink { kind: 'repo' | 'live' | 'apk' | 'docs' | 'evidence'; label: string; url: string }
interface Shot { src: ImageMetadata; alt: string; kind: 'web' | 'phone' | 'chart' }
interface Project {
  id: string; name: string; year: string; tier: 'featured' | 'ml' | 'more';
  oneLiner: string; summary: string; highlights: string[];
  layers: LayerId[];                    // first entry is the primary layer
  stack: string[]; metrics: Metric[]; links: ProjectLink[]; shots: Shot[];
  status?: string;                      // e.g. "Research prototype"
  limits?: string[];                    // stated openly, in the owner's README voice
  repos: string[];                      // owner/name, joined with the GitHub snapshot
  resumeTitle?: string;                 // the name the résumé uses, when it differs
}
interface Layer {
  id: LayerId; part: PhonePartId; partName: string; name: string;
  line: string;                         // "What crosses the air."
  body: string; skills: string[]; projectIds: string[];
}
```

The stack is described as six layers. Each maps to one phone part (versions A and B) and one glass slab (version C):

| Layer | Phone part | Projects |
|---|---|---|
| Interface | Display | StudEase, PAM, Notepad four ways, Emplinx, Taskverse |
| Protocols and crypto | Antenna | QuantumLink-PQC, ClipBridge, TermADB |
| Services and data | Logic board | StudEase ledger, PAM engine, Emplinx HRMS, event-management system |
| Models | Camera | RL car game, Predoctor, DSAAllocator, Smart Crop, QuantumLink seed model |
| System | SoC | Redmi 13C 5G "air" bring-up, TWRP-X663, Raw-x663, Pulse |
| Ops and tooling | Battery | CI/CD and deploys in StudEase and PAM, ai-bridge-mcp |

Content rules, checked by unit tests:

- Every project has at least one link and every featured project at least one metric.
- Every metric and every claim is taken from the résumé or the project's README. Nothing is rounded up.
- A project that calls itself a prototype in its README carries that status on the page.
- No private or company code, screenshots or numbers. Emplinx is described only with résumé facts.

## 5. GitHub data

`scripts/sync-github.mjs` reads public data only: the user, the repository list, per-repository languages and the contribution calendar. It writes `src/data/github.json` with a `fetchedAt` date. It uses `GITHUB_TOKEN` when present (CI), validates the result, and keeps the previous snapshot when a request fails or the shape looks wrong. The build never talks to the network.

The pages show the number of public repositories, the contribution total and calendar for the last year, languages by the number of repositories that contain them, and each project's created and last-pushed dates. Stars and followers are not shown.

## 6. Shared 3D foundation

- `engine.ts`: one renderer per page. Clamps the pixel ratio, resizes with a `ResizeObserver`, stops rendering when the tab is hidden or nothing changed, handles WebGL context loss, disposes cleanly.
- `capabilities.ts`: WebGL support, reduced motion, and a device tier (`high`, `low`) from core count, memory and software renderers.
- `phone/`: a procedural phone, no downloaded model. Parts: cover glass, display, mid-frame with antenna bands and buttons, logic board with shield can, SoC, memory, connectors and camera modules, battery, lower board, back cover. Each part knows its assembled and exploded position and a callout anchor. The screen is a canvas texture.
- `lines/`: crease and silhouette edge extraction, drawn as screen-space quads with constant pixel width. Used by version B.
- One fixed, transparent canvas per page. DOM elements called slots say where the scene should appear; the scene follows them.

Fallbacks, the same in every version:

| Situation | Behaviour |
|---|---|
| No WebGL, or context creation fails | A still image of the scene takes its place. All content and navigation work. |
| `prefers-reduced-motion` | No idle motion and no scroll-driven movement. State changes cut or cross-fade. |
| JavaScript disabled | Full content as static HTML. Sub-pages appear in sequence. |
| Low device tier | Lower pixel ratio, no post-processing, cheaper materials. |
| Context lost | Rendering pauses, the still image shows, and rendering resumes on restore. |

## 7. Version A: About phone (`/phone/`)

Direction contract:

- THESIS: the person presented as a device, in the one screen every Android user knows, About phone. It refuses the hero-plus-cards arrangement: there is no hero, only the settings list and the device.
- OWN-WORLD: a custom-ROM skin of its own. Tonal surfaces from one green-teal seed (hue 158), near-white cards on a tinted ground in light, the reverse in dark. Roboto Flex set wide and heavy for the collapsing title, regular for rows. Grouped list cards with large outer and small inner radii, switches, chips, snackbars. Authored line icons.
- STORY: the visitor recognises the screen, reads name and role as device rows, finds contact actions at once, opens projects as App info pages that each lead with one measured number, and discovers that the phone comes apart under Hardware.
- FIRST VIEWPORT: phone: the collapsing title "About vbs", the device card with the 3D phone, name, role and five actions. Desktop: the 3D phone fills a sticky left pane, the settings column sits on the right, actions above the fold.
- FORM: Android Settings interface language (seed key 58aaeff1, sixth of seven grounded candidates). Raised by the hand it beat: one measured quantity per project row in fixed digits (counter); one tonal ramp for every surface (exposure record); each project keeps its own mark and colour (sign river); a project page owns the viewport with the next one a swipe away (vertical feed); created and last-pushed dates on every project (brine calendar); no texture that is not tied to real data (hand-processed film).
- FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Sections, in order: device card (name, role, actions) · About · Experience · Hardware (the six layers, scroll-driven teardown) · Apps (projects, each opening an App info page at `#/apps/<id>`) · Education and certification · Hackathons · Activity (GitHub) · Build (build number, licences, other builds) · Developer options (hidden until unlocked).

Signature interaction: tapping Build number seven times unlocks Developer options, as on Android. The switches are real and change the site: Show layout bounds, Debug GPU overdraw, Profile HWUI rendering, Animator duration scale, Force RTL layout. Nothing essential lives there.

Other behaviour: search across all rows and projects (`/` focuses it); light and dark follow the system and can be switched; the 3D phone's screen shows a miniature of the page, and the selected project's real Android screenshot when one exists.

## 8. Version B: Service manual (`/manual/`)

Direction contract:

- THESIS: "Full-stack, taken literally." A service drawing of one phone, where every part is a layer the owner builds. It refuses decoration: every line, number and stamp is a drawing convention carrying a fact.
- OWN-WORLD: whiteprint in light (blue-black ink on cool drafting white) and blueprint in dark (white lines on Prussian blue). One fluorescent highlighter yellow marks the active part and the primary action. Archivo set extra-condensed and heavy for titles, regular for text; Chivo Mono for dimensions, part numbers and measured values. Sheet borders with zone marks, title blocks, numbered balloons with leader lines, dimension lines, stamps.
- STORY: the drawing draws itself, the visitor reads the name in the title block, scrolls and watches the phone come apart one numbered part at a time, reads the parts list to learn what is built at each layer, then studies the figure plates for proof.
- FIRST VIEWPORT: the assembled phone in ink lines, turning slowly in axonometric view, the name in condensed capitals beside it, the thesis line, three actions, and the title block in the lower right corner.
- FORM: exploded-view service-manual drawing (first of seven grounded candidates, the builder's own pick). Honest risk: callouts are tight on small phones, so there the stage pins to the top and the parts list scrolls beneath it.
- FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Sheets, in order: 1 General arrangement (cover) · 2 Exploded view and parts list · 3 Figure plates (projects) · 4 Revision history (experience and education) · 5 Approvals (hackathons and certification) · 6 Activity log (GitHub) and the closing title block (contact).

Signature interaction: the scroll-driven exploded view. Balloons are buttons; selecting one highlights the part and its row in the parts list, by pointer or keyboard. The camera is orthographic.

## 9. Version C: Classic (`/classic/`)

Direction contract:

- THESIS: the familiar 3D developer portfolio, played straight and finished properly: dark studio, one glossy centrepiece, projects, timeline, contact.
- OWN-WORLD: blue-black studio ground, one warm gold accent, and a stack of six iridescent glass slabs, one per layer. Mona Sans, expanded and bold for display, regular for text; Monaspace Neon only for code-like values. The typefaces are GitHub's own, because the content comes from GitHub.
- STORY: name and role land first, the stack shows the range, selecting a slab filters the work to that layer, and the page closes on contact.
- FIRST VIEWPORT: name, role, thesis and two actions on the left; the glass stack on the right, turning slowly, lit by soft area lights.
- FORM: the category standard, chosen by the owner as one of the three builds.
- FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Sections, in order: hero · about · the stack (interactive layers) · work (featured projects, then the rest, filterable by layer) · experience · education and recognition · GitHub (statistics and a 3D contribution skyline) · contact.

Signature interaction: the glass stack opens as the visitor reaches it, and each slab is a filter for the work below.

## 10. Quality floor, all versions

- Semantic HTML, one `h1`, a skip link, visible focus, 44 px touch targets, WCAG 2.2 AA contrast (checked by a unit test over `palettes.ts`).
- Responsive from 320 px to 2560 px. No horizontal scrolling.
- Self-hosted variable fonts, latin subset, the display face preloaded.
- Images served as AVIF and WebP with explicit dimensions, lazy below the fold.
- Per-page title and description, Open Graph image, JSON-LD `Person`, sitemap, robots.txt, favicon and manifest.
- A print stylesheet that drops the 3D and prints the content cleanly.
- No third-party requests at runtime.

## 11. Testing

- `npm run check`: `astro check` (TypeScript, strict).
- `npm test`: vitest. Content rules, palette contrast, GitHub snapshot parsing, formatters, search index, edge extraction.
- `npm run test:e2e`: Playwright against the built site, in installed Edge. Each version at desktop and phone sizes: no console errors, no horizontal overflow, keyboard path, axe accessibility scan, WebGL-off fallback, reduced-motion behaviour, no-JavaScript content.
- Visual review: desktop and phone screenshots of every version, inspected in two batched rounds.

## 12. Deployment

`.github/workflows/deploy.yml` runs on pushes to `main`, on a weekly schedule and on demand: install, refresh GitHub data, check, unit tests, build, deploy with `actions/deploy-pages`. The repository's Pages source must be set to "GitHub Actions" once.

## 13. Not in this build

A blog, a contact form, analytics, per-job content tailoring, and a custom domain. LinkedIn, a portrait and full college names are added when the owner supplies them.
