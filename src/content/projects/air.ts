import type { Project } from '../types';

const device = 'https://github.com/vbs-0/device_xiaomi_air';
const vendor = 'https://github.com/vbs-0/vendor_xiaomi_air';

export const air: Project = {
  id: 'air',
  name: 'Redmi 13C 5G bring-up',
  year: '2025 to 2026',
  tier: 'featured',
  oneLiner: 'Device tree, vendor blobs, kernel images and a TWRP tree for a MediaTek MT6835 phone, codename air.',
  summary:
    'The build files needed to make a custom Android ROM and recovery for the Xiaomi Redmi 13C 5G and POCO M6 5G, split across four repositories.',
  highlights: [
    'Device tree with VINTF manifests, 112 init scripts, 90 resource overlays and IMS and VoLTE support, set up for an OmniROM-style build.',
    'Vendor tree that packages the proprietary blobs, with extraction scripts for Linux, macOS and Windows PowerShell.',
    'Kernel repository with the stock image, DTB, DTBO and vendor ramdisk, so a ROM builds without compiling a kernel.',
    'TWRP recovery tree with the boot control HAL and MediaTek partition helpers.',
  ],
  layers: ['system'],
  stack: ['AOSP build system', 'Makefile', 'Shell', 'PowerShell', 'C++'],
  metrics: [
    { value: '112', label: 'init scripts in the device tree', source: `${device}#readme` },
    { value: '1,557', label: 'vendor files, about 900 MB', source: `${vendor}#what-is-inside` },
    { value: '4', label: 'repositories: device, vendor, kernel, recovery' },
  ],
  links: [
    { kind: 'repo', label: 'Device tree', url: device },
    { kind: 'repo', label: 'Vendor blobs', url: vendor },
    { kind: 'repo', label: 'Kernel images', url: 'https://github.com/vbs-0/air-kernel' },
    { kind: 'repo', label: 'TWRP tree', url: 'https://github.com/vbs-0/twrp_xiaomi_air' },
  ],
  shots: [],
  figure: {
    kind: 'table',
    title: 'Target device',
    head: ['Field', 'Value'],
    rows: [
      ['Codename', 'air'],
      ['Model', '23128PC33I'],
      ['Chipset', 'MediaTek Dimensity 6100+ (MT6835)'],
      ['Partitioning', 'A/B with dynamic partitions'],
      ['Boot header', 'v4'],
    ],
  },
  glyph: 'chip',
  status: 'Work in progress',
  limits: [
    'The TWRP tree is a starting point, not a finished daily-driver recovery.',
    'The kernel is the stock prebuilt image; nothing is built from source.',
  ],
  repos: ['vbs-0/device_xiaomi_air', 'vbs-0/vendor_xiaomi_air', 'vbs-0/air-kernel', 'vbs-0/twrp_xiaomi_air'],
};
