import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/QuantumLink-PQC';

export const quantumlink: Project = {
  id: 'quantumlink',
  name: 'QuantumLink-PQC',
  resumeTitle: 'Quantum Resistant Secure Chat Platform',
  year: '2025 to 2026',
  tier: 'featured',
  oneLiner: 'Post-quantum messaging, made visible: Kyber-512, Dilithium-2 and AES-256-GCM with a TensorFlow seed model.',
  summary:
    'My final-year major project: a chat prototype where two local peers exchange keys with Kyber-512, sign with Dilithium-2 and encrypt messages with AES-256-GCM, while the interface shows each protocol step.',
  highlights: [
    'Two Flask peers exchange encrypted message packages; the browser shows key encapsulation, signatures and connection state as they happen.',
    'A TensorFlow model generates seed material, and the same checks pass with a freshly trained model.',
    'Modified ciphertext, authentication tags and signatures are rejected on the tested path.',
    'Published with an evidence report from 11 November 2026: screenshots, an environment inventory and source fingerprints.',
  ],
  layers: ['protocol', 'models'],
  stack: ['Python', 'Flask', 'Socket.IO', 'kyber-py', 'dilithium-py', 'TensorFlow'],
  metrics: [
    { value: '15/15', label: 'targeted crypto checks passed', source: `${repo}#verification-at-a-glance` },
    { value: '3/3', label: 'messages delivered and decrypted in the two-way browser test', source: `${repo}#verification-at-a-glance` },
  ],
  links: [
    { kind: 'repo', label: 'Source', url: repo },
    { kind: 'evidence', label: 'Evidence report', url: `${repo}/blob/main/evidence/2026-11-11/REPORT.md` },
  ],
  shots: [
    { file: 'quantumlink/web-chat.png', kind: 'web', alt: 'QuantumLink chat: a three-message conversation between two test peers, with model and security status above', caption: 'Two-way conversation, tested build' },
    { file: 'quantumlink/web-handshake.png', kind: 'web', alt: 'QuantumLink: an incoming connection request waiting to be accepted', caption: 'Connection request' },
  ],
  glyph: 'lattice',
  status: 'Research prototype',
  limits: [
    'A working local demo, not production-security assurance.',
    'Each Flask peer handles plaintext; this is not a server-blind or zero-knowledge design.',
    'A model that predicts well is not thereby a sound source of cryptographic randomness.',
  ],
  repos: ['vbs-0/QuantumLink-PQC'],
};
