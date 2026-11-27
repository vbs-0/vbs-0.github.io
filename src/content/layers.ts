import type { Layer } from './types';

/**
 * The stack as six layers, front of the phone to back.
 * Each layer maps to one phone part (About phone, Service manual) and one glass slab (Classic).
 */
export const layers: Layer[] = [
  {
    id: 'interface',
    part: 'display',
    partName: 'Display',
    name: 'Interface',
    line: 'What people touch.',
    body: 'Web consoles in React and TypeScript, Android apps in Flutter and Kotlin, and installable web apps that keep working offline.',
    skills: ['React', 'TypeScript', 'Flutter', 'Kotlin', 'Next.js', 'Tailwind CSS', 'HTML and CSS', 'PWA'],
    projectIds: ['studease', 'pam', 'notepad', 'taskverse'],
    workNote: 'At SkyLinx: the Emplinx web application and its Android app.',
  },
  {
    id: 'protocol',
    part: 'antenna',
    partName: 'Antenna',
    name: 'Protocols and crypto',
    line: 'What crosses the air.',
    body: 'Wire protocols implemented by hand, discovery and sync on the local network, and post-quantum key exchange.',
    skills: ['TCP and UDP sockets', 'ADB wire protocol', 'AES-256-GCM', 'Kyber-512', 'Dilithium-2', 'Socket.IO', 'Rust', 'Java'],
    projectIds: ['quantumlink', 'clipbridge', 'termadb'],
  },
  {
    id: 'services',
    part: 'board',
    partName: 'Logic board',
    name: 'Services and data',
    line: 'Where the rules live.',
    body: 'APIs and decision engines with money in integer paise, append-only ledgers, idempotent writes, and tests that run against a real PostgreSQL.',
    skills: ['Python', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'PostgreSQL', 'MySQL', 'SQLite', 'SQLAlchemy', 'REST APIs'],
    projectIds: ['studease', 'pam', 'lightinv'],
    workNote:
      'At SkyLinx: multi-tenant Django modules for recruitment, attendance, payroll, leave and employee self-service, and an event management system on FastAPI.',
  },
  {
    id: 'models',
    part: 'camera',
    partName: 'Camera',
    name: 'Models',
    line: 'What learns from data.',
    body: 'World-model reinforcement learning, classifiers served behind Flask, a TensorFlow seed model inside a crypto pipeline, and retrieval-augmented generation.',
    skills: ['TensorFlow', 'Keras', 'JAX', 'scikit-learn', 'Pandas', 'NumPy', 'Reinforcement learning', 'RAG'],
    projectIds: ['rl', 'predoctor', 'dsaallocator', 'smartcrop', 'quantumlink', 'travel', 'social'],
  },
  {
    id: 'system',
    part: 'soc',
    partName: 'System-on-chip',
    name: 'System',
    line: 'What boots it.',
    body: 'Android bring-up for MediaTek hardware: device trees, vendor blobs, kernel images and recovery. Small native tools that talk to the platform directly.',
    skills: ['AOSP build system', 'Shell scripting', 'Device trees', 'TWRP', 'Magisk', 'Rust without std', 'Linux'],
    projectIds: ['air', 'infinix', 'pulse', 'notepad'],
  },
  {
    id: 'ops',
    part: 'battery',
    partName: 'Battery',
    name: 'Ops and tooling',
    line: 'What keeps it running.',
    body: 'Pipelines that run tests, docs checks and reproducibility checks on every push, deploys with a health check and a one-command rollback, and tooling for coding agents.',
    skills: ['GitHub Actions', 'Docker', 'nginx', 'systemd', 'Git', 'Oracle Cloud', 'AWS'],
    projectIds: ['studease', 'pam', 'aibridge'],
  },
];
