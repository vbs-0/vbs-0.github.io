# Portfolio, three ways

Veerabhadra Swami Challagali's portfolio, built three times from one content source with three.js.
Pick a version per application; each is a complete page at its own address.

| Address | Version | What it is |
|---|---|---|
| `/` | the default | Whatever `defaultVariant` in `site.config.ts` names. Today: About phone. |
| `/phone/` | About phone | A custom-ROM Settings screen where the device is the person. The 3D phone mirrors the page, comes apart under Hardware, and its display shows the open app. |
| `/manual/` | Service manual | A drawing sheet: an ink-line phone that takes itself apart as you scroll, a numbered parts list, and figure plates for the projects. |
| `/classic/` | Classic | Dark studio, a stack of six glass slabs (one per layer of the stack), a work list you can filter by layer, and a 3D contribution skyline. |

Live site: <https://vbs-0.github.io>.

## Which version to send

- Applying for a mobile, Android or full-stack role: `/phone/`. It shows range and playfulness.
- Applying somewhere that values rigour, systems or hardware: `/manual/`. It shows how you think.
- Applying for an AI/ML role, or sending it cold: `/classic/`. It is the expected shape, done properly.

To change what `/` shows, edit `defaultVariant` in `site.config.ts` and push. The other addresses never change.

## Run it

Node 22.23.4 or newer.

```sh
npm install
npm run dev          # http://127.0.0.1:4321
npm run build        # static site in dist/
npm run preview      # serve the build
```

## Check it

```sh
npm run check        # TypeScript and Astro, strict
npm test             # unit tests: content, colour contrast, GitHub parsing, search, edges, the phone model
npm run test:e2e     # browser tests against the build, desktop and phone, with axe
npm run verify       # check + unit tests + build
```

The browser tests use the installed Chrome (`channel: 'chrome'`); in CI they use Playwright's Chromium.
They run with software WebGL, and they check each version for console errors, sideways scrolling,
accessibility (axe, WCAG 2.1 and 2.2 AA), the WebGL-off fallback, and the no-JavaScript page, plus
each version's own interactions.

## The motion

Moving between builds plays a sweep: bands, blades and a flash cover the screen, the next build paints
already covered and the cover leaves. Changing theme floods the new colour out of the switch. Opening a
project morphs its icon into the header, and filtering the work moves the projects that stay.

All of it animates transform, opacity or a view transition, and all of it is off under reduced motion
(or About phone's animator scale set to 0). `DESIGN.md` has the detail; `src/lib/motion/` has the code.

## Change the content

Everything factual lives in `src/content/`:

| File | Holds |
|---|---|
| `profile.ts` | Name, role, thesis, about paragraphs, email, phone, links, the résumé path |
| `experience.ts` | Employer, roles, education, certification, hackathons |
| `layers.ts` | The six layers of the stack, each mapped to a phone part and to projects |
| `projects/*.ts` | One file per project: summary, highlights, measured numbers with sources, links, screenshots, limits |
| `projects.ts` | The order of projects and the three tiers (featured, machine learning, more) |

Rules the unit tests enforce: every project has a link and a layer; every featured project has a measured
number; every number that cites a source cites an `https://github.com/` URL; every image a project names
exists and is listed in `src/assets/projects/provenance.json`. Adding a project means adding its file,
its entry in `projects.ts`, and its place in a layer.

## Refresh the GitHub data

```sh
npm run sync:github   # public data only -> src/data/github.json
```

The build never calls the network. The snapshot is committed, so the site builds offline; the deploy
workflow refreshes it on every run and again every Monday. Set `GITHUB_TOKEN` to stay inside the API
rate limit (the workflow passes its own token).

## Refresh the screenshots

```sh
npm run sync:shots -- --check   # verify files against provenance.json, no network
npm run sync:shots              # download anything missing from the owner's public repositories
```

`src/assets/projects/provenance.json` records, for every image, the repository, the path, the fetch date
and a SHA-256. Images are never edited by hand.

## Refresh the still images of the 3D scenes

With `npm run dev` running:

```sh
npm run posters
```

This renders the fallback stills in `src/assets/posters/` from the development viewer at `/lab/`
(the lab is routed in development only). Re-run it after changing the phone model or its materials.

## Deploy

`.github/workflows/deploy.yml` builds, checks, tests and deploys to GitHub Pages on every push to `main`.

One-time setting: in the repository, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Design and decisions

- `PRODUCT.md`: who the site is for, what it must do, what is public and what is not.
- `docs/superpowers/specs/2026-11-27-portfolio-three-ways-design.md`: the design of all three versions.
- `docs/superpowers/plans/2026-11-27-portfolio-three-ways.md`: how it was built.
- `DESIGN.md`: the tokens, type, components and motion of each version, as built.

## Stack

Astro 7 (static output), TypeScript, three.js 0.187, Vitest, Playwright. Fonts are self-hosted variable
files (Roboto Flex, Archivo, Chivo Mono, Mona Sans, Monaspace Neon). No analytics, no third-party
requests at runtime, no server.
