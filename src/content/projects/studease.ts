import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/studease';

export const studease: Project = {
  id: 'studease',
  name: 'StudEase',
  year: '2026',
  tier: 'featured',
  oneLiner: 'Tuition, scholarships and payments, reconciled three ways against an append-only ledger.',
  summary:
    'A tuition and fees system: it bills each student from versioned fee schedules, decides scholarships by published rules, allocates payments to the oldest due line first, and proves every balance three ways.',
  highlights: [
    'Every balance is checked three ways: the stated balance, the sum of the append-only ledger, and invoices minus payments plus refunds.',
    'Money is integer paise. A payment is idempotent and commits the payment, its allocations, the ledger rows and the balance in one transaction.',
    'A seeded generator writes 10,000 students and 50,000 payments; two runs produce byte-identical data.',
    'One FastAPI service behind a React web app and a Flutter Android app, with five roles.',
    'CI runs lint, the full test suite, a docs-freshness check, the reproducibility check and a secrets scan on every push.',
  ],
  layers: ['services', 'interface', 'ops'],
  stack: ['FastAPI', 'PostgreSQL', 'React', 'TypeScript', 'Flutter', 'GitHub Actions'],
  metrics: [
    { value: '318', label: 'backend tests', source: `${repo}#tests` },
    { value: '1,004,038', label: 'rows generated, identical across two runs', source: `${repo}#verify-the-data` },
    { value: '5', label: 'labelled anomaly types, all detected', source: `${repo}#the-five-labelled-anomalies` },
  ],
  links: [
    { kind: 'live', label: 'Live demo', url: 'https://studease.is-cool.dev' },
    { kind: 'repo', label: 'Source', url: repo },
    { kind: 'apk', label: 'Android APK', url: `${repo}/releases/latest` },
    { kind: 'docs', label: 'Architecture', url: `${repo}/blob/main/docs/architecture.md` },
  ],
  shots: [
    { file: 'studease/web-overview.png', kind: 'web', alt: 'StudEase staff overview: money charged and collected by month, with status cards', caption: 'Staff overview' },
    { file: 'studease/web-account.png', kind: 'web', alt: 'StudEase learner account: balance cards, money by kind and balance over time', caption: 'Learner account' },
    { file: 'studease/phone-overview.png', kind: 'phone', alt: 'StudEase Android app: staff overview with charts', caption: 'Android, staff overview' },
    { file: 'studease/phone-scholarships.png', kind: 'phone', alt: 'StudEase Android app: a learner\'s scholarships', caption: 'Android, scholarships' },
  ],
  logo: 'studease/logo.png',
  glyph: 'ledger',
  limits: [
    'Detector precision and recall of 1.0 are by construction: a regression test, not evidence that unknown faults would be found.',
    'Writes are serialised by one advisory lock, which is ample for a back-office tool.',
  ],
  repos: ['vbs-0/studease'],
};
