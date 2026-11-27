import type { Project } from '../types';

export const pulse: Project = {
  id: 'pulse',
  name: 'Pulse',
  year: '2026',
  tier: 'more',
  oneLiner: 'A no-root app freezer and live system monitor for Android.',
  summary:
    'Android does not let one app stop another. Pulse opens the target\'s app-info page through an accessibility service and presses Force stop for you; the rest is a memory and battery dashboard drawn with custom views.',
  highlights: ['An accessibility service walks the Settings tree and presses Force stop.', 'Ring gauge and sparkline are custom views, no chart library.'],
  layers: ['system', 'interface'],
  stack: ['Kotlin', 'Android'],
  metrics: [],
  links: [{ kind: 'repo', label: 'Source', url: 'https://github.com/Garuda-Technologies/pulse' }],
  shots: [],
  glyph: 'pulse',
  limits: ['A sideload tool: it depends on an accessibility service and on the Settings layout of the phone.'],
  repos: ['Garuda-Technologies/pulse'],
};

export const infinix: Project = {
  id: 'infinix',
  name: 'Infinix X663 recovery and camera',
  year: '2023 to 2025',
  tier: 'more',
  oneLiner: 'TWRP recovery builds and a Camera RAW Magisk module for Infinix X663 phones.',
  summary:
    'Recovery images for the Infinix X663 and X663C on Android 12, with fixes for internal storage detection, decryption at start-up and Magisk flashing, plus a Magisk module that enables Camera RAW.',
  highlights: ['Separate TWRP builds for two firmware versions, with a flashing guide.', 'The Camera RAW module was built with a collaborator in January 2023.'],
  layers: ['system'],
  stack: ['TWRP', 'Magisk', 'Shell'],
  metrics: [],
  links: [
    { kind: 'repo', label: 'TWRP builds', url: 'https://github.com/vbs-0/TWRP-X663' },
    { kind: 'repo', label: 'Camera RAW module', url: 'https://github.com/vbs-0/Raw-x663' },
  ],
  shots: [],
  glyph: 'wrench',
  repos: ['vbs-0/TWRP-X663', 'vbs-0/Raw-x663'],
};

export const taskverse: Project = {
  id: 'taskverse',
  name: 'Taskverse',
  year: '2025',
  tier: 'more',
  oneLiner: 'An animated drag-and-drop task manager.',
  summary: 'A task board where cards are dragged to reorder and prioritise, built with Next.js and Tailwind CSS.',
  highlights: ['Drag and drop with React DnD.', 'Responsive on desktop and phone.'],
  layers: ['interface'],
  stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
  metrics: [],
  links: [
    { kind: 'live', label: 'Live demo', url: 'https://taskverse3.vercel.app' },
    { kind: 'repo', label: 'Source', url: 'https://github.com/vbs-0/taskverse' },
  ],
  shots: [],
  glyph: 'kanban',
  repos: ['vbs-0/taskverse'],
};

export const travel: Project = {
  id: 'travel',
  name: 'Travel Companion',
  year: '2024',
  tier: 'more',
  oneLiner: 'Day-by-day itineraries written by an LLM, with the weather for the trip dates alongside.',
  summary: 'Enter where you are going, the dates and the budget, and get an itinerary with activities, food, costs in rupees and local transport tips.',
  highlights: ['Flask with server-rendered pages, accounts with bcrypt-hashed passwords.', 'Built by Team Garuda.'],
  layers: ['models', 'services'],
  stack: ['Python', 'Flask', 'SQLite', 'OpenAI API'],
  metrics: [],
  links: [{ kind: 'repo', label: 'Source', url: 'https://github.com/vbs-0/Travel_companion' }],
  shots: [],
  glyph: 'map',
  team: 'Team Garuda',
  repos: ['vbs-0/Travel_companion'],
};

export const lightinv: Project = {
  id: 'lightinv',
  name: 'light_inv',
  year: '2025',
  tier: 'more',
  oneLiner: 'Inventory and bus-fleet management for a transport operator, with role-based access and charted reports.',
  summary: 'Products, parts, buses, orders, fuel logs and expenditure in one Flask app, with four roles and an audit trail of every change.',
  highlights: ['Four roles: admin, manager, supervisor and user.', 'CSV bulk upload per entity, and a Docker image.'],
  layers: ['services'],
  stack: ['Python', 'Flask', 'SQLAlchemy', 'MySQL', 'Docker'],
  metrics: [],
  links: [{ kind: 'repo', label: 'Source', url: 'https://github.com/vbs-0/light_inv' }],
  shots: [],
  glyph: 'boxes',
  repos: ['vbs-0/light_inv'],
};

export const social: Project = {
  id: 'social',
  name: 'Distraction-Free Social',
  year: '2025',
  tier: 'more',
  oneLiner: 'A social platform for students to share and discover educational content.',
  summary: 'Profiles, study groups, posts and messages, with suggestions from an SVD recommender trained on interactions.',
  highlights: ['Recommendations with scikit-surprise SVD.', 'Storage is JSON files, no database server.'],
  layers: ['models', 'services'],
  stack: ['Python', 'Flask', 'scikit-learn', 'scikit-surprise'],
  metrics: [],
  links: [{ kind: 'repo', label: 'Source', url: 'https://github.com/vbs-0/Distraction-Free-Social' }],
  shots: [],
  glyph: 'people',
  repos: ['vbs-0/Distraction-Free-Social'],
};
