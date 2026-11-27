/** The snackbar at the bottom of the screen. One message at a time, announced politely. */
let timer = 0;

export function toast(message: string, ms = 2800): void {
  const el = document.querySelector<HTMLElement>('[data-snackbar]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('is-on'), ms);
}
