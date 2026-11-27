import type { Certification, Education, Experience, Hackathon } from './types';

export const experience: Experience = {
  employer: 'SkyLinx',
  product: 'Emplinx',
  roles: [
    { title: 'Software Engineer', kind: 'Full-time', start: '2026-07', end: null },
    { title: 'Software Engineer Intern', kind: 'Internship', start: '2026-04', end: '2026-06' },
  ],
  leadNote: 'One of two team leads on a nine-person engineering team.',
  bullets: [
    'Building Emplinx, a Django-based HRMS that spans a web application and an Android app, implementing features end to end.',
    'Developing multi-tenant modules for recruitment, attendance, payroll, leave and employee self-service.',
    'Developed an event management system as a FastAPI web application, from feature development through testing to deployment.',
  ],
};

export const education: Education[] = [
  { degree: 'B.Tech', field: 'Artificial Intelligence and Machine Learning', school: 'SVEC', start: '2023', end: '2026' },
  { degree: 'Diploma', field: 'Electrical and Electronics Engineering', school: 'AKRG', start: '2017', end: '2022' },
];

export const certifications: Certification[] = [
  {
    issuer: 'NVIDIA',
    name: 'Building RAG Agents with LLMs',
    date: '2025-05',
    note: 'Certificate of Competency: retrieval-augmented generation systems for large language models, with a focus on knowledge retrieval and context integration.',
  },
];

export const hackathons: Hackathon[] = [
  { name: 'Algo Phoenix 2025', result: '1st place', rank: 1, detail: 'Algorithm optimisation hackathon, BBSC with GeeksforGeeks', year: '2025' },
  { name: 'Hack Wave 1.0', result: '3rd place', rank: 3, detail: 'Hackathon' },
  { name: 'Hack Overflow 2K24', result: 'Participant', rank: null, detail: 'College-level hackathon', year: '2024' },
];
