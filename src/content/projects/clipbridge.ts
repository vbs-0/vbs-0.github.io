import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/clipbridge';

export const clipbridge: Project = {
  id: 'clipbridge',
  name: 'ClipBridge',
  year: '2026',
  tier: 'featured',
  oneLiner: 'A clipboard and screenshot bridge between Windows and Android over your own Wi-Fi. Rust and Kotlin, AES-256-GCM, no cloud.',
  summary:
    'Copy on the PC and paste on the phone, or the reverse. Text and images travel directly between the two devices on the local network, encrypted, with no account and no server in the middle.',
  highlights: [
    'UDP discovery and length-prefixed TCP sync. Both sides listen and dial, so Windows never needs an inbound firewall rule.',
    'Each frame is AES-256-GCM with a random 12-byte nonce; the key is derived from a shared PIN.',
    'On Android, an input method reads the clipboard in the background, because the platform only lets the focused app read it.',
    'The Windows app wakes on WM_CLIPBOARDUPDATE, so idle CPU is zero.',
    'Built and run against a real Android phone and a Windows 11 PC on the same Wi-Fi.',
  ],
  layers: ['protocol', 'system'],
  stack: ['Rust', 'Win32', 'Kotlin', 'Android'],
  metrics: [
    { value: '~46 KB', label: 'Android APK per ABI, no libraries', source: `${repo}#readme` },
    { value: '~950 KB', label: 'Windows binary', source: `${repo}#readme` },
  ],
  links: [{ kind: 'repo', label: 'Source', url: repo }],
  shots: [],
  figure: {
    kind: 'table',
    title: 'Channels',
    head: ['Channel', 'Port', 'Carries'],
    rows: [
      ['Discovery', 'UDP 47823', 'Broadcast, unicast reply'],
      ['Sync', 'TCP 47824', 'Length-prefixed frames, AES-256-GCM'],
      ['Dashboard', 'HTTP 47825', 'History on the PC'],
    ],
  },
  glyph: 'clipboard',
  limits: [
    'Local network only, and the dashboard has no authentication.',
    'The PIN is stored in plain text on both devices.',
  ],
  repos: ['vbs-0/clipbridge'],
};
