import type { Project } from '../types';

const repo = 'https://github.com/vbs-0/pam';

export const pam: Project = {
  id: 'pam',
  name: 'PAM',
  year: '2026',
  tier: 'featured',
  oneLiner: 'A household finance register for Indian UPI, bank and card transactions: web console, Android app and API.',
  summary:
    'Payment Account Manager answers three questions for a household: what did we really spend, what repeats, and are we inside budget. Every decision it makes is traceable to a rule, a version and a confidence.',
  highlights: [
    'Reports true spend: transfers between own accounts, card-bill payments, refunds and UPI reversals are matched and left out. A naive ledger reads 129% too high on the starter data.',
    'Rules instead of a model, so every category carries a rule id, a version and a confidence, and what the rules cannot decide goes to a human queue.',
    'The Android app and the web PWA work offline: changes are queued, then synced with idempotency keys.',
    'A seeded generator recreates 500,000 transactions byte for byte, and the engine is scored against hidden ground truth.',
    'Four roles, each with only its own screens: customer, analyst, reviewer and administrator.',
  ],
  layers: ['services', 'interface', 'ops'],
  stack: ['FastAPI', 'PostgreSQL', 'React 19', 'Tailwind CSS', 'Flutter', 'GitHub Actions'],
  metrics: [
    { value: '97.99%', label: 'category accuracy on 500,000 transactions', source: `${repo}#results` },
    { value: '1.000', label: 'transfer-matching F1', source: `${repo}#results` },
    { value: '0.909', label: 'refund-link recall, target 0.90', source: `${repo}#results` },
    { value: '200+', label: 'backend tests', source: `${repo}#testing-approach` },
  ],
  links: [
    { kind: 'live', label: 'Live demo', url: 'https://pam.is-cool.dev' },
    { kind: 'repo', label: 'Source', url: repo },
    { kind: 'apk', label: 'Android APK', url: 'https://pam.is-cool.dev/downloads/pam.apk' },
    { kind: 'docs', label: 'API docs', url: 'https://pam.is-cool.dev/docs' },
  ],
  shots: [
    { file: 'pam/web-folio.png', kind: 'web', alt: 'PAM web console: the monthly folio with true spend, budgets against actual and a twelve-month chart', caption: 'Web console, folio' },
    { file: 'pam/web-budgets.png', kind: 'web', alt: 'PAM web console: budgets by category with limits and status', caption: 'Budgets' },
    { file: 'pam/phone-folio.png', kind: 'phone', alt: 'PAM Android app: folio with true spend for the month', caption: 'Android, folio' },
    { file: 'pam/phone-spend.png', kind: 'phone', alt: 'PAM Android app: spend by category', caption: 'Android, spend' },
  ],
  logo: 'pam/logo.png',
  glyph: 'rupee',
  limits: [
    'Refund-link recall is just over target (0.909 against 0.90); missed links surface as exceptions rather than wrong matches.',
    'Single node. A worker queue would be the next step for larger runs.',
  ],
  repos: ['vbs-0/pam'],
};
