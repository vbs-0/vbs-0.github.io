import type { LayerId, Project } from './types';
import { aibridge } from './projects/aibridge';
import { air } from './projects/air';
import { clipbridge } from './projects/clipbridge';
import { dsaallocator, predoctor, rl, smartcrop } from './projects/ml';
import { infinix, lightinv, pulse, social, taskverse, travel } from './projects/more';
import { notepad } from './projects/notepad';
import { pam } from './projects/pam';
import { quantumlink } from './projects/quantumlink';
import { studease } from './projects/studease';
import { termadb } from './projects/termadb';

/** Display order: featured products and tools, then the machine-learning projects, then the rest. */
export const projects: Project[] = [
  studease,
  pam,
  quantumlink,
  air,
  clipbridge,
  notepad,
  termadb,
  aibridge,
  rl,
  predoctor,
  dsaallocator,
  smartcrop,
  pulse,
  infinix,
  taskverse,
  travel,
  lightinv,
  social,
];

export const featured = projects.filter((p) => p.tier === 'featured');
export const mlProjects = projects.filter((p) => p.tier === 'ml');
export const moreProjects = projects.filter((p) => p.tier === 'more');

const byId = new Map(projects.map((p) => [p.id, p]));

export function projectById(id: string): Project {
  const p = byId.get(id);
  if (!p) throw new Error(`Unknown project id: ${id}`);
  return p;
}

export function projectsForLayer(id: LayerId): Project[] {
  return projects.filter((p) => p.layers.includes(id));
}

/** The headline number of a project, if it has one. */
export function headline(p: Project) {
  return p.metrics[0];
}
