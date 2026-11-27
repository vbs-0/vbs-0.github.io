/**
 * Shows one view at a time: the settings list, or one App info page (#app-<id>).
 * Without JavaScript every view is simply visible in sequence and the same links jump to them.
 */
export interface OpenApp {
  id: string;
  name: string;
  metric: string;
  screen: string;
}

export interface Router {
  current(): OpenApp | null;
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

  const describe = (el: HTMLElement): OpenApp => ({ id: el.dataset.app ?? '', name: el.dataset.name ?? '', metric: el.dataset.metric ?? '', screen: el.dataset.screen ?? '' });

  function show(target: HTMLElement | null, hash: string): void {
    const previous = open;
    if (target) {
      if (!previous) {
        homeScroll = window.scrollY;
        cameFromHome = true;
      }
      open = describe(target);
      if (home) home.hidden = true;
      for (const a of apps) a.hidden = a !== target;
      target.dataset.enter = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
      target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      document.title = `${open.name} · ${baseTitle}`;
      if (barTitle) barTitle.textContent = open.name;
    } else {
      open = null;
      if (home) home.hidden = false;
      for (const a of apps) a.hidden = true;
      document.title = baseTitle;
      if (barTitle) barTitle.textContent = 'About vbs';
      const section = hash.length > 1 && hash !== '#top' && hash !== '#apps' ? document.getElementById(hash.slice(1)) : null;
      if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
      else if (previous) window.scrollTo({ top: homeScroll, behavior: 'instant' });
      if (previous) document.querySelector<HTMLElement>(`a.row[href="#app-${previous.id}"]`)?.focus({ preventScroll: true });
    }
    document.body.classList.toggle('in-app', open !== null);
    if (back) back.hidden = open === null;
    onChange(open);
  }

  function route(): void {
    const hash = location.hash;
    const target = hash.startsWith('#app-') ? (apps.find((a) => a.id === hash.slice(1)) ?? null) : null;
    if (target === null && open === null && hash.length > 1) return; // an ordinary in-page link on the home view
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
  route();
  return { current: () => open };
}
