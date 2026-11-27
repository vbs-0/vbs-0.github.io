/**
 * The three builds of the portfolio. Each one is a complete page with the same content.
 *   phone   — "About phone": a custom-ROM Settings screen with a live 3D phone
 *   manual  — "Service manual": an exploded-view drawing in ink lines
 *   classic — "Classic": dark studio, glass layer stack, project grid
 */
export const VARIANTS = ['phone', 'manual', 'classic'] as const;
export type VariantId = (typeof VARIANTS)[number];

export const siteConfig = {
  /** Public origin. Change this if you move to a custom domain. */
  site: 'https://vbs-0.github.io',
  /**
   * Which build the root URL (/) shows. Every build also keeps its own address
   * (/phone/, /manual/, /classic/), so a link you already sent never changes.
   */
  defaultVariant: 'phone' as VariantId,
  /** Show the small "other builds" links in each footer. */
  showVariantSwitcher: true,
} as const;

export const variantMeta: Record<VariantId, { path: string; name: string; blurb: string }> = {
  phone: { path: '/phone/', name: 'About phone', blurb: 'A Settings screen with a live 3D phone' },
  manual: { path: '/manual/', name: 'Service manual', blurb: 'An exploded-view drawing in ink lines' },
  classic: { path: '/classic/', name: 'Classic', blurb: 'Dark studio with a glass layer stack' },
};

/** The other builds to link from a footer, or nothing when the switcher is off. */
export function otherBuilds(current: VariantId): { id: VariantId; path: string; name: string; blurb: string }[] {
  if (!siteConfig.showVariantSwitcher) return [];
  return VARIANTS.filter((v) => v !== current).map((id) => ({ id, ...variantMeta[id] }));
}
