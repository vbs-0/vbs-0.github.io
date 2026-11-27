/**
 * Shows one view at a time: the settings list, or one App info page (#app-<id>).
 * Where the browser supports view transitions, the app's icon and name morph from the list row into the
 * page header instead of the page simply switching.
 * Without JavaScript every view is visible in sequence and the same links jump to them.
 */
import { clearNames, nameFor, withViewTransition } from '@/lib/motion/view-transition';

export interface OpenApp {
  id: string;
  name: string;
  metric: string;
  screen: string;
}

export interface Router {
  current(): OpenApp | null;
}

interface Morph {
  from: (Element | null | undefined)[];
  to: (Element | null | undefined)[];
}

/**
 * Names the old elements, swaps, names the new ones, then clears every name.
 * `after` runs once the swap is really on screen: focus must not be moved while the browser is
 * still holding the old snapshot, or it lands on a hidden element and is lost.
 */
function morph(from: Morph['from'], to: Morph['to'], update: () => void, after?: () => void): void {
  const names = ['app-icon', 'app-title'];
  from.forEach((el, i) => nameFor(el, names[i] as string));
  const finished = withViewTransition(() => {
    from.forEach((el) => nameFor(el, ''));
    update();
    to.forEach((el, i) => nameFor(el, names[i] as string));
  });
  if (finished) {
    void finished.then(() => {
      clearNames();
      after?.();
    });
  } else {
    after?.();
  }
}

export function createRouter(onChange: (app: OpenApp | null) => void): Router {
  const home = document.querySelector<HTMLElement>('[data-view="home"]');
  const apps = [...document.querySelectorAll<HTMLElement>('[data-view="app"]')];
  const back = document.querySelector<HTMLAnchorElement>('[data-back]');
  const barTitle = document.querySelector<HTMLElement>('[data-bar-title]');
  const baseTitle = document.title;
  let open: OpenApp | null = null;
  let homeScroll = 0;
  let cameFromHome = false;
  let pending: { id: string; row: HTMLElement } | null = null;

  const describe = (el: HTMLElement): OpenApp => ({ id: el.dataset.app ?? '', name: el.dataset.name ?? '', metric: el.dataset.metric ?? '', screen: el.dataset.screen ?? '' });
  const rowFor = (id: string) => document.querySelector<HTMLElement>(`a.row[href="#app-${id}"]`);
  const appIcon = (el: Element | null | undefined) => el?.querySelector('.app-icon') ?? null;
  const appTitle = (el: Element | null | undefined) => el?.querySelector('h2') ?? el?.querySelector('.row__label') ?? null;

  // Remember which row was clicked, so the icon and name can travel from it.
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#app-"]');
    if (link) pending = { id: (link.getAttribute('href') ?? '').slice(1), row: link };
  });

  function show(target: HTMLElement | null, hash: string): void {
    const previous = open;
    const from = pending;
    pending = null;

    if (target) {
      const app = describe(target);
      const swap = () => {
        if (!previous) {
          homeScroll = window.scrollY;
          cameFromHome = true;
        }
        open = app;
        if (home) home.hidden = true;
        for (const a of apps) a.hidden = a !== target;
        target.dataset.enter = '';
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.title = `${app.name} · ${baseTitle}`;
        if (barTitle) barTitle.textContent = app.name;
      };
      const focusHeading = () => target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      if (from && from.id === app.id) morph([appIcon(from.row), appTitle(from.row)], [appIcon(target), appTitle(target)], swap, focusHeading);
      else morph([], [], swap, focusHeading);
    } else {
      const app = previous;
      const row = app ? rowFor(app.id) : null;
      const swap = () => {
        open = null;
        if (home) home.hidden = false;
        for (const a of apps) a.hidden = true;
        document.title = baseTitle;
        if (barTitle) barTitle.textContent = 'About vbs';
        const section = hash.length > 1 && hash !== '#top' && hash !== '#apps' ? document.getElementById(hash.slice(1)) : null;
        if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
        else if (app) window.scrollTo({ top: homeScroll, behavior: 'instant' });
      };
      const fromApp = app ? apps.find((a) => a.dataset.app === app.id) : null;
      const focusRow = () => {
        if (app) row?.focus({ preventScroll: true });
      };
      if (app && row) morph([appIcon(fromApp), appTitle(fromApp)], [appIcon(row), appTitle(row)], swap, focusRow);
      else morph([], [], swap, focusRow);
    }
    document.body.classList.toggle('in-app', open !== null);
    if (back) back.hidden = open === null;
    onChange(open);
  }

  function route(): void {
    const hash = location.hash;
    const target = hash.startsWith('#app-') ? (apps.find((a) => a.id === hash.slice(1)) ?? null) : null;
    if (target === null && open === null && hash.length > 1) return; // an ordinary in-page link on the home view
    if (target === null && open === null) return;
    show(target, hash);
  }

  back?.addEventListener('click', (e) => {
    e.preventDefault();
    if (cameFromHome && history.length > 1) history.back();
    else location.hash = '#apps';
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open && !document.querySelector('dialog[open]')) back?.click();
  });
  addEventListener('hashchange', route);

  for (const a of apps) a.hidden = true;
  if (location.hash.startsWith('#app-')) route();
  return { current: () => open };
}
