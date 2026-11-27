export * from './types';
export { profile } from './profile';
export { certifications, education, experience, hackathons } from './experience';
export { layers } from './layers';
export { featured, headline, mlProjects, moreProjects, projectById, projects, projectsForLayer } from './projects';

import { layers } from './layers';
import type { LayerId } from './types';

export function layerById(id: LayerId) {
  const l = layers.find((x) => x.id === id);
  if (!l) throw new Error(`Unknown layer id: ${id}`);
  return l;
}
