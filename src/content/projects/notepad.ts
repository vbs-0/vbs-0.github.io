import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/notepad-showdown';

export const notepad: Project = {
  id: 'notepad',
  name: 'Notepad, four ways',
  year: '2026',
  tier: 'featured',
  oneLiner: 'One notepad app built four times, in Kotlin, Flutter, Rust with Slint and Rust without std, to measure what each Android stack adds.',
  summary:
    'The same small app, written four times, to answer one question with artifacts rather than opinions: what does each stack add on top of your own code?',
  highlights: [
    'Kotlin with platform views ships a 34,257-byte APK with zero dependencies, because the toolkit is already on the phone.',
    'Rust without the standard library is the smallest at 24,741 bytes, and pays for it in code: it draws its own glyphs in 2,150 lines.',
    'Flutter bundles its engine: 16,938,208 bytes for the same feature set.',
    'The finding: the toolkit decides the size, not the language.',
  ],
  layers: ['system', 'interface'],
  stack: ['Kotlin', 'Flutter', 'Rust', 'Slint'],
  metrics: [
    { value: '24,741 B', label: 'smallest APK, Rust without std', source: `${repo}#measured` },
    { value: '34,257 B', label: 'Kotlin APK, zero dependencies', source: `${repo}#measured` },
    { value: '684x', label: 'the Flutter APK against the smallest', source: `${repo}#measured` },
  ],
  links: [{ kind: 'repo', label: 'Source and measurements', url: repo }],
  shots: [],
  figure: {
    kind: 'bars',
    title: 'APK size, arm64-v8a',
    unit: 'bytes',
    items: [
      { label: 'Rust, no std', value: 24741, note: 'release, 2,150 lines' },
      { label: 'Kotlin', value: 34257, note: 'release, 504 lines' },
      { label: 'Rust + Slint', value: 7533918, note: 'debug build, 323 lines' },
      { label: 'Flutter', value: 16938208, note: 'release, 598 lines' },
    ],
  },
  glyph: 'four',
  limits: [
    'Start-up time, memory and frame time were not measured.',
    'The Slint figure is a debug build; its release size is unmeasured.',
  ],
  repos: ['vbs-0/notepad-showdown'],
};
