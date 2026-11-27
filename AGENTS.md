# Portfolio, three ways

One content source, three complete versions of the same portfolio, built with Astro and three.js.
Read `README.md` first; product truth is `PRODUCT.md`.

## Layout

- `site.config.ts`: site origin, `defaultVariant` (which version `/` renders), the footer switcher.
- `src/content/`: every fact, typed. A fact is edited here, once.
- `src/data/github.json`: public GitHub snapshot, written by `scripts/sync-github.mjs`, committed.
- `src/assets/projects/`: screenshots and logos from the owner's public repositories, with `provenance.json`.
- `src/assets/posters/`: still images of the 3D scenes for the no-WebGL fallback, written by `scripts/capture-posters.mjs`.
- `src/lib/`: shared code that knows nothing about any version (colour, format, GitHub, search, three.js helpers).
- `src/lib/three/phone/`: the procedural phone, its rig, and the two ways it is drawn (`styles/pbr.ts`, `styles/ink.ts`).
- `src/variants/<id>/`: one version each: `Page.astro`, components, `*.css`, `client/`.
- `src/lab/`: the development viewer for the phone at `/lab/`, routed in dev only.
- `tests/unit/`, `tests/e2e/`.

## Rules

1. A version imports only from `src/content`, `src/lib`, `src/styles/palettes.ts` and `src/components/shared`. Never from another version.
2. Facts come from `src/content` only. A version owns labels and micro-copy, never facts.
3. Public facts are the résumé, the owner's READMEs and public GitHub data, plus what `PRODUCT.md` lists as approved. Never add private or employer code, screenshots or numbers.
4. Every page must be complete without WebGL, without JavaScript and with reduced motion. The still images and the static HTML are part of the product, not a fallback to fix later.
5. Colours live in `src/styles/palettes.ts` only. Text pairs must pass the contrast tests in `tests/unit/palettes.test.ts`.
6. Fonts are self-hosted (Fontsource). No third-party requests at runtime.
7. The three.js bundle is loaded with a dynamic import after first paint. Do not import three.js from a page's main script.

## Verify

```sh
npm run verify        # astro check, vitest, build
npm run test:e2e      # Playwright against the build, desktop and phone, with axe
```

Regenerate the posters (`npm run posters`, with `npm run dev` running) after changing the phone model,
its materials, or any palette.

## Commits

End every commit message with `Authored-By: vbs-0` and nothing about tooling. Push only to
`vbs-0/vbs-0.github.io`.
