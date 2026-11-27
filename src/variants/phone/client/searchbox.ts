/** The search screen: a full-screen dialog over the page's own content. */
import { type SearchEntry, search } from '@/lib/search-core';

export function initSearch(onGo: (href: string) => void): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-search]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]');
  const list = dialog?.querySelector<HTMLUListElement>('[data-search-results]');
  const hint = dialog?.querySelector<HTMLElement>('[data-search-hint]');
  const source = document.getElementById('search-index');
  if (!dialog || !input || !list || !source) return;

  const index = JSON.parse(source.textContent ?? '[]') as SearchEntry[];
  let results: SearchEntry[] = [];

  const go = (href: string) => {
    dialog.close();
    onGo(href);
  };

  function render(): void {
    const query = input!.value;
    results = search(index, query, 10);
    list!.replaceChildren(
      ...results.map((entry) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'row';
        a.href = entry.href;
        const text = document.createElement('div');
        const title = document.createElement('p');
        title.className = 'row__label';
        title.textContent = entry.title;
        const sub = document.createElement('p');
        sub.className = 'row__sub';
        sub.textContent = entry.subtitle;
        text.append(title, sub);
        const kind = document.createElement('span');
        kind.className = 'row__end';
        kind.textContent = entry.group;
        a.append(document.createElement('span'), text, kind);
        a.addEventListener('click', (e) => {
          e.preventDefault();
          go(entry.href);
        });
        li.append(a);
        return li;
      }),
    );
    if (hint) {
      hint.hidden = results.length > 0;
      if (query.trim() && results.length === 0) hint.textContent = `Nothing here matches "${query.trim()}". Try a technology or a project name.`;
    }
  }

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.value = '';
    render();
    input.focus();
  };

  document.querySelector('[data-search-open]')?.addEventListener('click', open);
  dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && results[0]) {
      e.preventDefault();
      go(results[0].href);
    }
  });
  addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.isContentEditable);
    if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });
}
