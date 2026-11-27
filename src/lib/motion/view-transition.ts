/**
 * View transitions, when the browser has them and the visitor has not asked for less motion.
 * Returns false when the change happened without one, so callers can skip any cleanup.
 */
export function withViewTransition(update: () => void): Promise<void> | null {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (reduced || typeof doc.startViewTransition !== 'function') {
    update();
    return null;
  }
  return doc.startViewTransition(update).finished.catch(() => undefined);
}

/**
 * Gives an element a view-transition name, so the browser morphs it into the matching element on the
 * other side of a change. Names must be unique: the caller clears them when the transition ends.
 */
export function nameFor(el: Element | null | undefined, name: string): void {
  if (el instanceof HTMLElement) el.style.viewTransitionName = name;
}

export function clearNames(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')) el.style.viewTransitionName = '';
}
