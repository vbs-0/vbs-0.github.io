import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/termadb';

export const termadb: Project = {
  id: 'termadb',
  name: 'TermADB',
  year: '2026',
  tier: 'featured',
  oneLiner: 'An ADB and Fastboot client that runs on the phone itself, over Wi-Fi. No PC, no cable.',
  summary:
    'A terminal on one Android device that debugs another: connect over Wi-Fi and run shell, push, pull, install, screencap and reboot. Written in Java against the ADB wire protocol, with no libraries.',
  highlights: [
    'Implements the ADB transport packets directly: CNXN, AUTH, OPEN, WRTE, OKAY and CLSE.',
    'Generates its RSA key on the phone and performs the ADB authentication handshake.',
    'Implements the sync sub-protocol behind push, pull and install.',
    'Speaks Fastboot over TCP, including sparse-image handling for flashing.',
  ],
  layers: ['protocol', 'system'],
  stack: ['Java', 'Android'],
  metrics: [
    { value: '0', label: 'libraries: Java against the wire protocol', source: `${repo}#readme` },
    { value: '11', label: 'commands, from connect to fastboot', source: `${repo}#commands` },
  ],
  links: [{ kind: 'repo', label: 'Source', url: repo }],
  shots: [
    { file: 'termadb/phone-help.png', kind: 'phone', alt: 'TermADB running on a phone: its command list in an on-device terminal', caption: 'Command list, on the device' },
  ],
  glyph: 'terminal',
  limits: [
    'Wi-Fi only: there is no USB host mode, so the target must expose ADB over TCP.',
    'A sideload tool. It asks for all-files access, which store rules restrict.',
  ],
  repos: ['vbs-0/termadb'],
};
