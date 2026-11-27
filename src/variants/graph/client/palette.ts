/**
 * The command palette: ⌘K (or /, or the button in the bar) opens a dialog that searches every node and
 * every action by name. Arrow keys move, Enter opens, Escape closes. It is the keyboard path to the whole
 * map, so the map never depends on hitting a small target with a mouse.
 */
export interface PaletteItem {
  id: string;
  label: string;
  kind: string;
  layer: string;
}

export interface PaletteOptions {
  items: PaletteItem[];
  hrefs: Record<string, string>;
  /** Returns 'select' when the palette should hand back to the map, 'navigate' when it left the page. */
  onSelect(id: string): 'select' | 'navigate';
}

/** Subsequence match, so "qpk" finds "QuantumLink-PQC" and "svc" finds "Services and data". */
function score(query: string, label: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  const direct = l.indexOf(q);
  if (direct >= 0) return 100 - direct + (direct === 0 ? 50 : 0);
  let i = 0;
  let gaps = 0;
  for (const ch of l) {
    if (ch === q[i]) i++;
    else if (i > 0) gaps++;
    if (i === q.length) return Math.max(1, 40 - gaps);
  }
  return 0;
}

const KIND_LABEL: Record<string, string> = { layer: 'Layer', project: 'Project', skill: 'Tool', action: 'Action' };

export function initPalette(opts: PaletteOptions): { open(): void; close(): void } {
  const dialog = document.querySelector<HTMLDialogElement>('[data-palette]');
  const input = document.querySelector<HTMLInputElement>('[data-palette-input]');
  const list = document.querySelector<HTMLElement>('[data-palette-list]');
  const empty = document.querySelector<HTMLElement>('[data-palette-empty]');
  const opener = document.querySelector<HTMLButtonElement>('[data-open-palette]');
  if (!dialog || !input || !list) return { open() {}, close() {} };
  let results: PaletteItem[] = [];
  let active = 0;

  const render = () => {
    const q = input.value.trim();
    results = opts.items
      .map((item) => ({ item, s: score(q, item.label) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.item.label.localeCompare(b.item.label))
      .slice(0, 9)
      .map((r) => r.item);
    if (active >= results.length) active = 0;
    list.innerHTML = '';
    results.forEach((item, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `pal-${i}`;
      button.className = i === active ? 'palette__item is-active' : 'palette__item';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(i === active));
      const kind = document.createElement('span');
      kind.className = 'palette__kind';
      kind.textContent = KIND_LABEL[item.kind] ?? item.kind;
      const label = document.createElement('span');
      label.className = 'palette__label';
      label.textContent = item.label;
      button.append(kind, label);
      button.addEventListener('click', () => choose(item));
      button.addEventListener('pointermove', () => {
        active = i;
        paint();
      });
      li.append(button);
      list.append(li);
    });
    if (empty) empty.hidden = results.length > 0;
    input.setAttribute('aria-activedescendant', results.length > 0 ? `pal-${active}` : '');
  };
  const paint = () => {
    [...list.querySelectorAll<HTMLButtonElement>('.palette__item')].forEach((el, i) => {
      el.classList.toggle('is-active', i === active);
      el.setAttribute('aria-selected', String(i === active));
    });
    input.setAttribute('aria-activedescendant', results.length > 0 ? `pal-${active}` : '');
  };
  const choose = (item: PaletteItem) => {
    const href = opts.hrefs[item.id];
    const verdict = opts.onSelect(item.id);
    close();
    if (verdict === 'navigate' && href) location.href = href;
  };
  const open = () => {
    if (dialog.open) return;
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    input.focus();
  };
  const close = () => {
    if (dialog.open) dialog.close();
  };

  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    // Chrome eats Escape on a search input to clear it, so the dialog would never hear it.
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      opener?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(results.length - 1, active + 1);
      paint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, active - 1);
      paint();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) choose(item);
    }
  });
  dialog.addEventListener('click', (e) => {
    // A click on the backdrop closes; a click inside the box does not.
    if (e.target === dialog) close();
  });
  opener?.addEventListener('click', open);
  addEventListener('keydown', (e) => {
    const typing = (e.target as Element | null)?.closest('input, textarea, select, [contenteditable]');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    } else if (e.key === '/' && !typing && !dialog.open) {
      e.preventDefault();
      open();
    }
  });
  return { open, close };
}
