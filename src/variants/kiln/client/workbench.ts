export function mountWorkbench(): void {
  const tablist = document.querySelector<HTMLElement>('[data-bench-tabs]');
  if (!tablist) return;
  const controls = [...tablist.querySelectorAll<HTMLAnchorElement>('a')].flatMap((tab) => {
    const panel = document.getElementById(tab.hash.slice(1));
    return panel ? [{ tab, panel }] : [];
  });
  if (controls.length < 2) return;

  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Workbench projects');
  const orientation = matchMedia('(max-width: 780px)');
  const setOrientation = () => tablist.setAttribute('aria-orientation', orientation.matches ? 'horizontal' : 'vertical');
  orientation.addEventListener('change', setOrientation);
  setOrientation();

  function select(index: number, focus = false): void {
    controls.forEach(({ tab, panel }, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
      if (selected && focus) tab.focus();
    });
  }

  controls.forEach(({ tab, panel }, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(index);
      history.replaceState(null, '', tab.hash);
    });
    tab.addEventListener('keydown', (event) => {
      const [prev, next] = orientation.matches ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      const end = controls.length - 1;
      if (event.key === ' ') {
        event.preventDefault();
        tab.click();
        return;
      }
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? end :
        event.key === prev ? (index + end) % controls.length :
        event.key === next ? (index + 1) % controls.length : -1;
      if (target < 0) return;
      event.preventDefault();
      select(target, true);
    });
  });

  const selectHash = (hash: string, fallback = false) => {
    const index = controls.findIndex(({ tab }) => tab.hash === hash);
    if (index >= 0 || fallback) select(Math.max(0, index));
  };
  selectHash(location.hash, true);
  addEventListener('hashchange', () => selectHash(location.hash));
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest<HTMLAnchorElement>('[data-project-jump]');
    if (link) selectHash(link.hash);
  });
}
