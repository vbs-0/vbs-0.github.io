/**
 * The icon set: authored line glyphs on a 24 by 24 grid, one stroke weight, round caps.
 * Values are the inner markup of an <svg>; Icon.astro supplies the element and its attributes.
 */
const d = (path: string) => `<path d="${path}"/>`;

export const icons = {
  // Interface
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  moon: d('M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z'),
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  back: d('M19 12H5M11 6l-6 6 6 6'),
  chevron: d('m9 6 6 6-6 6'),
  external: d('M8 16 16 8M9 8h7v7'),
  close: d('M6 6l12 12M18 6 6 18'),
  check: d('m5 12.5 4.5 4.5L19 7.5'),
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  braces: d('M9 4c-2 0-3 1-3 3v2.5c0 1.2-.8 2-2 2.5 1.2.5 2 1.3 2 2.5V17c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2.5c0 1.2.8 2 2 2.5-1.2.5-2 1.3-2 2.5V17c0 2-1 3-3 3'),
  layers: d('m12 3 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5M3 17l9 5 9-5'),
  hash: d('M9 3 7 21M17 3l-2 18M4 8.5h17M3 15.5h17'),
  scale: d('M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7Zm14 0-3 7a3.5 3.5 0 0 0 6 0l-3-7Z'),
  // Contact
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  phone: d('M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.500 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.500 5.200 2 2 0 0 1 6.500 3Z'),
  github:
    '<path fill="currentColor" stroke="none" transform="scale(1.5)" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>',
  telegram: d('M21 4 3 11l6 2.5M21 4l-3.5 15-8.5-5.5M21 4 9 13.5V19l3-3.5'),
  download: d('M12 4v11M7 11l5 5 5-5M5 20h14'),
  file: d('M7 3h7l4 4v14H7ZM14 3v4h4'),
  // Sections
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.200 2 8 6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  school: d('m2 9 10-5 10 5-10 5L2 9Zm4 2.5V16c1.5 1.5 3.5 2.5 6 2.5s4.500-1 6-2.500v-4.500M22 9v6'),
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  activity: d('M3 12h4l2.5-7 5 14 2.5-7h4'),
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  // Link kinds
  play: d('M7 4.5v15l12-7.5-12-7.5Z'),
  package: d('M4 8 12 4l8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8'),
  book: d('M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11'),
  evidence: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 13l2.5 2.5 4.500-5"/>',
  // Phone parts
  display: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  antenna: d('M12 21V11M8 14.5a5 5 0 0 1 0-7M16 14.5a5 5 0 0 0 0-7M5 17.5a9.500 9.500 0 0 1 0-13M19 17.500a9.500 9.500 0 0 0 0-13'),
  board: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4v4H7zM14.5 9h.01M17.5 9h.01M14.500 12h.01M17.500 12h.01M7 16h10"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M22 10.5v3M7 10.500v3M10.500 10.500v3"/>',
  // Projects
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  ledger: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M11.5 8h5M11.500 12h5M11.500 16h3"/>',
  rupee: d('M7 5h10M7 9.5h10M7 5h3.5a4.500 4.500 0 0 1 0 9H7l7 6'),
  lattice: '<path d="M5 5h.01M12 5h.01M19 5h.01M5 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01"/><rect x="8.5" y="11" width="7" height="5.5" rx="1"/><path d="M10 11V9.500a2 2 0 0 1 4 0V11"/>',
  clipboard: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9.5 5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M9 12h6M13 9.500l2.500 2.500-2.500 2.500"/>',
  four: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
  agents: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v4M12 11l-6 5M12 11l6 5"/>',
  car: d('M4 15v-3l2-5h12l2 5v3M4 15h16M4 15v3h3v-3M17 15v3h3v-3M7.5 12h.01M16.500 12h.01'),
  plate: '<circle cx="13" cy="12" r="6"/><circle cx="13" cy="12" r="2.5"/><path d="M4 4v6a1.500 1.500 0 0 0 1.500 1.500V20"/>',
  checklist: d('m4 6.5 1.5 1.5L8 5.500M4 12.500l1.500 1.500L8 11.500M4 18.500l1.500 1.500L8 17.500M11.500 7H20M11.500 13H20M11.500 19H20'),
  leaf: d('M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 20 14 10'),
  pulse: d('M3 12h4l2.5-7 5 14 2.5-7h4'),
  wrench: d('M14.5 6a4 4 0 0 0-5.2 5.2L3.500 17l3.500 3.500 5.800-5.800A4 4 0 0 0 18 9.500L15.500 12 12 8.500 14.500 6Z'),
  kanban: '<rect x="4" y="4" width="4.5" height="14" rx="1"/><rect x="9.75" y="4" width="4.5" height="9" rx="1"/><rect x="15.5" y="4" width="4.5" height="16" rx="1"/>',
  map: d('m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Zm6-2v14m6-12v14'),
  boxes: d('M3 13h8v8H3zM13 13h8v8h-8zM8 3h8v8H8z'),
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3-5 6.500-5s5.900 1.500 6.500 5M16 4.800a3.500 3.500 0 0 1 0 6.400M18 15.500c2 .7 3.200 2.200 3.500 4.500"/>',
} as const;

export type IconName = keyof typeof icons;

/** The phone-part icon for a layer's part, and the system-on-chip icon. */
export const partIcon = { display: 'display', antenna: 'antenna', board: 'board', camera: 'camera', soc: 'chip', battery: 'battery' } as const satisfies Record<string, IconName>;

export function isIcon(name: string): name is IconName {
  return name in icons;
}
