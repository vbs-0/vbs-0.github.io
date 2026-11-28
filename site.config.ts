/**
 * The builds of the portfolio. Each one is a complete page with the same content.
 *   pop, tide, kiln — the three motion editions: a toy, a wave, and a fire
 *   studio  — "Studio": kinetic type, a shader field, a stack of six layers; no phone
 *   film    — "Film": opening titles and cuts between the layers
 *   phone   — "About phone": a custom-ROM Settings screen with a live 3D phone
 *   manual  — "Service manual": an exploded-view drawing in ink lines
 *   classic — "Classic": dark studio, glass layer stack, project grid
 */
export const MOTION_EDITIONS = ['pop', 'tide', 'kiln'] as const;
export type MotionEdition = (typeof MOTION_EDITIONS)[number];
export const VARIANTS = ['studio', ...MOTION_EDITIONS, 'film', 'graph', 'phone', 'manual', 'classic'] as const;
export type VariantId = (typeof VARIANTS)[number];

export const siteConfig = {
  /** Public origin. Change this if you move to a custom domain. */
  site: 'https://vbs-0.github.io',
  /**
   * Which build the root URL (/) shows. Every build also keeps its own address.
   */
  defaultVariant: 'studio' as VariantId,
  /** Show the small "other builds" links in each footer. */
  showVariantSwitcher: true,
} as const;

export const variantMeta: Record<VariantId, { path: string; name: string; blurb: string }> = {
  studio: { path: '/studio/', name: 'Studio', blurb: 'Kinetic type, a live dust field and six stacked layers' },
  pop: { path: '/pop/', name: 'Pop', blurb: 'A bright sticker playground with a 3D loop you can spin.' },
  tide: { path: '/tide/', name: 'Tide', blurb: 'A blue field journal with a flowing 3D wave you can ripple.' },
  kiln: { path: '/kiln/', name: 'Kiln', blurb: 'A terracotta workshop with a fire you can stoke.' },
  film: { path: '/film/', name: 'Film', blurb: 'Opening titles: one camera move through every layer' },
  graph: { path: '/graph/', name: 'System map', blurb: 'Every project as a node in one 3D chart, with a command palette' },
  phone: { path: '/phone/', name: 'About phone', blurb: 'A Settings screen with a live 3D phone' },
  manual: { path: '/manual/', name: 'Service manual', blurb: 'An exploded-view drawing in ink lines' },
  classic: { path: '/classic/', name: 'Classic', blurb: 'Dark studio with a glass layer stack' },
};

/** The other builds to link from a footer, or nothing when the switcher is off. */
export function otherBuilds(current: VariantId): { id: VariantId; path: string; name: string; blurb: string }[] {
  if (!siteConfig.showVariantSwitcher) return [];
  return VARIANTS.filter((v) => v !== current).map((id) => ({ id, ...variantMeta[id] }));
}
