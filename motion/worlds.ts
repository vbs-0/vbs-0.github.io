export const worlds = {
  flow: {
    name: 'Flow',
    path: '',
    headline: ['Software in', 'motion.'],
    intro: 'From product interfaces and APIs to the systems they run on.',
    material: 'Liquid ribbons',
    work: 'Work that ships',
    projectIds: ['studease', 'pam', 'taskverse'],
  },
  tide: {
    name: 'Tide',
    path: 'tide/',
    headline: ['Built below', 'the surface.'],
    intro: 'A closer look at protocols, models and the proof behind them.',
    material: 'Open water',
    work: 'Field notes',
    projectIds: ['quantumlink', 'predoctor', 'dsaallocator'],
  },
  kiln: {
    name: 'Kiln',
    path: 'kiln/',
    headline: ['Build it.', 'Prove it.'],
    intro: 'Small tools, systems-level work, and measurements you can check.',
    material: 'Flame and embers',
    work: 'On the bench',
    projectIds: ['clipbridge', 'notepad', 'air'],
  },
} as const;

export type World = keyof typeof worlds;
export const worldIds = Object.keys(worlds) as World[];
