/**
 * Every colour of every build, exported as hex.
 * The stylesheets (as CSS custom properties), the three.js scenes and the contrast tests all read from here.
 */
import type { VariantId } from '@site';
import { oklch } from '../lib/color.ts';

export type Theme = 'light' | 'dark';
export type Palette = Record<string, string>;

/** About phone: one green-teal seed (hue 158), tonal ramp, warm tertiary. */
const H = 158;
const phone: Record<Theme, Palette> = {
  light: {
    bg: oklch(0.945, 0.018, H),
    surface: oklch(0.992, 0.005, H),
    surfaceHi: oklch(0.955, 0.022, H),
    well: oklch(0.915, 0.028, H),
    text: oklch(0.2, 0.02, H),
    textMuted: oklch(0.42, 0.03, H),
    outline: oklch(0.85, 0.022, H),
    primary: oklch(0.44, 0.115, H),
    onPrimary: '#ffffff',
    primaryContainer: oklch(0.89, 0.085, H),
    onPrimaryContainer: oklch(0.24, 0.06, H),
    tertiary: oklch(0.5, 0.15, 38),
    tertiaryContainer: oklch(0.91, 0.05, 48),
    onTertiaryContainer: oklch(0.3, 0.09, 38),
    danger: oklch(0.5, 0.19, 27),
    phoneBody: oklch(0.8, 0.07, 165),
    phoneFrame: oklch(0.72, 0.045, 170),
  },
  dark: {
    bg: oklch(0.165, 0.012, H),
    surface: oklch(0.225, 0.016, H),
    surfaceHi: oklch(0.275, 0.02, H),
    well: oklch(0.3, 0.024, H),
    text: oklch(0.93, 0.012, H),
    textMuted: oklch(0.76, 0.025, H),
    outline: oklch(0.37, 0.02, H),
    primary: oklch(0.84, 0.13, H),
    onPrimary: oklch(0.2, 0.05, H),
    primaryContainer: oklch(0.36, 0.075, H),
    onPrimaryContainer: oklch(0.93, 0.07, H),
    tertiary: oklch(0.82, 0.11, 48),
    tertiaryContainer: oklch(0.37, 0.075, 40),
    onTertiaryContainer: oklch(0.93, 0.045, 48),
    danger: oklch(0.78, 0.13, 25),
    phoneBody: oklch(0.34, 0.035, 170),
    phoneFrame: oklch(0.44, 0.03, 175),
  },
};

/** Service manual: whiteprint in light, blueprint in dark, one highlighter yellow. */
const manual: Record<Theme, Palette> = {
  light: {
    bg: oklch(0.925, 0.01, 240),
    paper: oklch(0.985, 0.004, 240),
    ink: oklch(0.27, 0.06, 262),
    inkMuted: oklch(0.45, 0.045, 258),
    rule: oklch(0.78, 0.035, 250),
    construction: oklch(0.61, 0.115, 240),
    highlight: oklch(0.93, 0.19, 104),
    onHighlight: oklch(0.25, 0.06, 262),
    shade: oklch(0.925, 0.014, 250),
  },
  dark: {
    bg: oklch(0.24, 0.07, 258),
    paper: oklch(0.3, 0.088, 258),
    ink: oklch(0.965, 0.012, 240),
    inkMuted: oklch(0.83, 0.04, 245),
    rule: oklch(0.5, 0.08, 255),
    construction: oklch(0.68, 0.1, 238),
    highlight: oklch(0.93, 0.19, 104),
    onHighlight: oklch(0.24, 0.07, 258),
    shade: oklch(0.265, 0.085, 258),
  },
};

/** Classic: blue-black studio, one gold accent, six tempering colours for the layers. Dark only. */
const classicDark: Palette = {
  bg: oklch(0.145, 0.022, 268),
  surface: oklch(0.195, 0.026, 268),
  surfaceHi: oklch(0.25, 0.03, 268),
  text: oklch(0.955, 0.008, 268),
  textMuted: oklch(0.75, 0.025, 268),
  outline: oklch(0.33, 0.03, 268),
  accent: oklch(0.85, 0.115, 88),
  onAccent: oklch(0.2, 0.035, 88),
  layerInterface: oklch(0.86, 0.115, 92),
  layerProtocol: oklch(0.76, 0.125, 58),
  layerServices: oklch(0.72, 0.14, 12),
  layerModels: oklch(0.7, 0.14, 305),
  layerSystem: oklch(0.72, 0.13, 255),
  layerOps: oklch(0.86, 0.075, 215),
};
const classic: Record<Theme, Palette> = { light: classicDark, dark: classicDark };

/**
 * Film: projection black and title white, and one grade per scene, never two on screen at once.
 * The grades follow the part each scene looks at: display azure, antenna violet, board green, lens rose,
 * silicon amber, battery ember. Dark only: it is a screening room.
 */
const filmDark: Palette = {
  bg: oklch(0.13, 0.004, 75),
  surface: oklch(0.18, 0.006, 75),
  surfaceHi: oklch(0.235, 0.008, 75),
  text: oklch(0.955, 0.012, 85),
  textMuted: oklch(0.75, 0.014, 85),
  outline: oklch(0.36, 0.01, 80),
  gTitle: oklch(0.87, 0.07, 78),
  gInterface: oklch(0.8, 0.115, 235),
  gProtocol: oklch(0.77, 0.13, 300),
  gServices: oklch(0.8, 0.14, 155),
  gModels: oklch(0.77, 0.13, 355),
  gSystem: oklch(0.85, 0.13, 88),
  gOps: oklch(0.77, 0.14, 45),
  phoneBody: oklch(0.25, 0.006, 260),
  phoneFrame: oklch(0.62, 0.012, 80),
};
const film: Record<Theme, Palette> = { light: filmDark, dark: filmDark };

/** Print inks for the original Film plates. Used offline, not shipped in the scene script. */
export const filmInks = {
  day: {
    zenith: '#d69052', haze: '#fae0a1', disc: '#fff1ba', distant: '#bc9c73', shale: '#8c9181',
    jade: '#56776a', moss: '#425a4c', pine: '#233e38', deep: '#182f2d', glint: '#d6b477',
    timber: '#392e2c', tile: '#354b41', window: '#eab35e', stone: '#ad8761', parapet: '#dfb77c',
  },
  night: {
    zenith: '#131d4a', haze: '#6378a6', disc: '#fff0c3', distant: '#697b9c', shale: '#425e82',
    jade: '#344f66', moss: '#294659', pine: '#173545', deep: '#102436', glint: '#869eae',
    timber: '#172538', tile: '#24495b', window: '#ffd481', stone: '#526782', parapet: '#8396ae',
  },
  silk: { dye: '#bf3225', hem: '#59261e', gold: '#e9aa56', block: '#301f21' },
  dust: { shadow: '#8f491d', body: '#db923b', light: '#ffe1a0' },
} as const;

/**
 * System map: a deep chart ground, one signal cyan for anything you can act on, and the six layer hues
 * as the only other colour. Dark only: it is a chart on a dark field.
 */
const graphDark: Palette = {
  bg: oklch(0.145, 0.02, 255),
  surface: oklch(0.185, 0.022, 255),
  surfaceHi: oklch(0.235, 0.026, 255),
  text: oklch(0.945, 0.012, 250),
  textMuted: oklch(0.755, 0.03, 250),
  outline: oklch(0.33, 0.03, 255),
  signal: oklch(0.86, 0.11, 185),
  onSignal: oklch(0.19, 0.03, 190),
  layerInterface: oklch(0.83, 0.1, 245),
  layerProtocol: oklch(0.79, 0.12, 295),
  layerServices: oklch(0.85, 0.13, 160),
  layerModels: oklch(0.82, 0.11, 355),
  layerSystem: oklch(0.87, 0.12, 88),
  layerOps: oklch(0.83, 0.11, 48),
};
const graph: Record<Theme, Palette> = { light: graphDark, dark: graphDark };

/**
 * Studio: bone paper and ink, one vermilion for what can be pressed, and gold only inside the shader.
 * Single theme; the hero and the closing section sit on ink, the rest on bone.
 */
const studioPalette: Palette = {
  bg: oklch(0.955, 0.014, 85),
  surface: oklch(0.915, 0.022, 85),
  ink: oklch(0.17, 0.012, 60),
  inkSoft: oklch(0.225, 0.014, 60),
  text: oklch(0.17, 0.012, 60),
  textMuted: oklch(0.4, 0.02, 70),
  paperMuted: oklch(0.78, 0.02, 85),
  outline: oklch(0.8, 0.02, 80),
  accent: oklch(0.66, 0.2, 35),
  accentInk: oklch(0.5, 0.19, 33),
  gold: oklch(0.84, 0.13, 85),
};
const studio: Record<Theme, Palette> = { light: studioPalette, dark: studioPalette };

const popPaper = {
  bg: '#fffaf0',
  sun: '#ffe477',
  cream: '#fff3b5',
  ink: '#211545',
  muted: '#4f3f5f',
  rule: '#cbbb9c',
  blue: '#2b38bb',
  sky: '#a4dcff',
  mint: '#9ceabb',
  green: '#16815a',
  pink: '#fa5786',
  blush: '#ffd4e1',
  shade: '#ac1949',
  glint: '#fff8ed',
};
const tidePaper = {
  bg: '#edf7fb',
  surface: '#f9fdff',
  foam: '#d5eefb',
  mist: '#acd9ed',
  ink: '#122b64',
  muted: '#3e5675',
  rule: '#9fbad0',
  blue: '#213bb4',
  deep: '#101e51',
  crest: '#2db9bc',
  glint: '#ecffff',
};
const kilnPaper = {
  bg: '#f8efdf',
  surface: '#fff8ed',
  putty: '#eddbbe',
  ink: '#2b2424',
  muted: '#634a42',
  rule: '#b69a81',
  oxide: '#8a3628',
  clay: '#c68260',
  wall: '#663c37',
  chamber: '#241b23',
  coal: '#3a2528',
  flame: '#fa732d',
  honey: '#ffbf58',
  core: '#fff2b3',
};
export const editionsPalette = { bg: '#f6f5ef', ink: '#22271f', muted: '#50594f', rule: '#b9c3b6', accent: '#2b5142' };

export const motionPalettes = {
  flow: {
    paper: '#e8ecdf', surface: '#f5f7ef', ink: '#12231b', muted: '#435449', rule: '#a9b6a6',
    button: '#192d23', 'button-ink': '#f3f9ea', stage: '#0d221e', deep: '#071610',
    accent: '#d1ff70', beam: '#7ce5fb', peak: '#f1ffbc', shade: '#2f8892', art: '#e5ffec',
  },
  tide: {
    paper: '#e5eff6', surface: '#f2f8fb', ink: '#122b44', muted: '#405c70', rule: '#a3b9c7',
    button: '#103453', 'button-ink': '#f4fbff', stage: '#143750', deep: '#051929',
    accent: '#91eeed', beam: '#86cffa', peak: '#e8fffd', shade: '#1c7294', art: '#ddfbfc',
  },
  kiln: {
    paper: '#191411', surface: '#261c17', ink: '#f7eade', muted: '#cdb8a8', rule: '#745a4b',
    button: '#ff975e', 'button-ink': '#281309', stage: '#27110e', deep: '#100d0c',
    accent: '#ff7139', beam: '#ffaf4a', peak: '#fff0af', shade: '#8e261c', art: '#ffe6d3',
  },
} as const satisfies Record<string, Palette>;

export const palettes: Record<VariantId, Record<Theme, Palette>> = {
  studio, film, graph, phone, manual, classic,
  pop: { light: popPaper, dark: popPaper },
  tide: { light: tidePaper, dark: tidePaper },
  kiln: { light: kilnPaper, dark: kilnPaper },
};

export function fixedScheme(variant: VariantId): Theme {
  return variant === 'pop' || variant === 'tide' || variant === 'kiln' ? 'light' : 'dark';
}

/** Text-on-background pairs that must hold a WCAG contrast ratio. [foreground, background, minimum]. */
export const contrastPairs: Record<VariantId, Array<[string, string, number]>> = {
  pop: [
    ...['bg', 'sun', 'cream', 'sky', 'mint', 'blush', 'pink'].map((bg): [string, string, number] => ['ink', bg, 4.5]),
    ['muted', 'bg', 4.5],
    ['muted', 'sun', 4.5],
    ['bg', 'blue', 4.5],
    ['blue', 'sun', 4.5],
  ],
  tide: [
    ...['bg', 'surface', 'foam', 'mist'].map((bg): [string, string, number] => ['ink', bg, 4.5]),
    ['muted', 'bg', 4.5],
    ['muted', 'surface', 4.5],
    ['surface', 'deep', 4.5],
    ['surface', 'blue', 4.5],
    ['blue', 'bg', 4.5],
  ],
  kiln: [
    ...['bg', 'surface', 'putty', 'clay', 'honey'].map((bg): [string, string, number] => ['ink', bg, 4.5]),
    ['muted', 'bg', 4.5],
    ['muted', 'putty', 4.5],
    ['surface', 'chamber', 4.5],
    ['surface', 'oxide', 4.5],
    ['honey', 'chamber', 4.5],
  ],
  studio: [
    ['ink', 'bg', 4.5],
    ['ink', 'surface', 4.5],
    ['textMuted', 'bg', 4.5],
    ['textMuted', 'surface', 4.5],
    ['accentInk', 'bg', 4.5],
    ['accentInk', 'surface', 4.5],
    ['ink', 'accent', 4.5],
    ['ink', 'gold', 4.5],
    ['bg', 'ink', 4.5],
    ['bg', 'inkSoft', 4.5],
    ['paperMuted', 'ink', 4.5],
    ['paperMuted', 'inkSoft', 4.5],
    ['accent', 'ink', 4.5],
    ['accent', 'inkSoft', 4.5],
    ['gold', 'ink', 4.5],
  ],
  graph: [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surfaceHi', 4.5],
    ['textMuted', 'bg', 4.5],
    ['textMuted', 'surface', 4.5],
    ['textMuted', 'surfaceHi', 4.5],
    ['signal', 'bg', 4.5],
    ['signal', 'surface', 4.5],
    ['onSignal', 'signal', 4.5],
    ...(['layerInterface', 'layerProtocol', 'layerServices', 'layerModels', 'layerSystem', 'layerOps'] as const).flatMap(
      (l): Array<[string, string, number]> => [
        [l, 'bg', 4.5],
        [l, 'surface', 4.5],
      ],
    ),
  ],
  film: [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surfaceHi', 4.5],
    ['textMuted', 'bg', 4.5],
    ['textMuted', 'surface', 4.5],
    ['textMuted', 'surfaceHi', 4.5],
    ['bg', 'text', 4.5],
    ...(['gTitle', 'gInterface', 'gProtocol', 'gServices', 'gModels', 'gSystem', 'gOps'] as const).flatMap(
      (g): Array<[string, string, number]> => [
        [g, 'bg', 4.5],
        [g, 'surface', 4.5],
        ['bg', g, 4.5],
      ],
    ),
  ],
  phone: [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surfaceHi', 4.5],
    ['text', 'well', 4.5],
    ['textMuted', 'bg', 4.5],
    ['textMuted', 'surface', 4.5],
    ['textMuted', 'surfaceHi', 4.5],
    ['primary', 'surface', 4.5],
    ['primary', 'bg', 4.5],
    ['onPrimary', 'primary', 4.5],
    ['onPrimaryContainer', 'primaryContainer', 4.5],
    ['onTertiaryContainer', 'tertiaryContainer', 4.5],
    ['tertiary', 'surface', 4.5],
    ['danger', 'surface', 4.5],
  ],
  manual: [
    ['ink', 'paper', 4.5],
    ['ink', 'bg', 4.5],
    ['inkMuted', 'paper', 4.5],
    ['inkMuted', 'bg', 4.5],
    ['onHighlight', 'highlight', 4.5],
    ['ink', 'shade', 4.5],
    ['construction', 'paper', 3],
  ],
  classic: [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surfaceHi', 4.5],
    ['textMuted', 'bg', 4.5],
    ['textMuted', 'surface', 4.5],
    ['textMuted', 'surfaceHi', 4.5],
    ['accent', 'bg', 4.5],
    ['accent', 'surface', 4.5],
    ['onAccent', 'accent', 4.5],
    ['layerInterface', 'surface', 4.5],
    ['layerProtocol', 'surface', 4.5],
    ['layerServices', 'surface', 4.5],
    ['layerModels', 'surface', 4.5],
    ['layerSystem', 'surface', 4.5],
    ['layerOps', 'surface', 4.5],
  ],
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** `--c-text:#123456;--c-bg:...` for one palette. */
export function cssVars(p: Palette): string {
  return Object.entries(p)
    .map(([k, v]) => `--c-${kebab(k)}:${v}`)
    .join(';');
}

/** A complete theme stylesheet for one build: light by default, dark by system preference or by `data-theme`. */
export function themeCss(variant: VariantId): string {
  const { light, dark } = palettes[variant];
  if (light === dark) return `:root{color-scheme:${fixedScheme(variant)};${cssVars(light)}}`;
  return [
    `:root{color-scheme:light;${cssVars(light)}}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;${cssVars(dark)}}}`,
    `:root[data-theme="dark"]{color-scheme:dark;${cssVars(dark)}}`,
  ].join('');
}
