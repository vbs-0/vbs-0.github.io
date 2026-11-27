/**
 * Every colour of every build, authored in OKLCH and exported as hex.
 * The stylesheets (as CSS custom properties), the three.js scenes and the contrast tests all read from here.
 */
import type { VariantId } from '@site';
import { oklch } from '@/lib/color';

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

export const palettes: Record<VariantId, Record<Theme, Palette>> = { film, phone, manual, classic };

/** Text-on-background pairs that must hold a WCAG contrast ratio. [foreground, background, minimum]. */
export const contrastPairs: Record<VariantId, Array<[string, string, number]>> = {
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
  if (light === dark) return `:root{color-scheme:dark;${cssVars(dark)}}`;
  return [
    `:root{color-scheme:light;${cssVars(light)}}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;${cssVars(dark)}}}`,
    `:root[data-theme="dark"]{color-scheme:dark;${cssVars(dark)}}`,
  ].join('');
}
