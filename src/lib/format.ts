/** Formatting helpers. All output is locale-independent so the build is reproducible. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** 24741 -> "24,741" */
export function formatInt(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `-${grouped}` : grouped;
}

/** 24741 -> "24.2 KB", 16938208 -> "16.2 MB". Binary units, one decimal below 100. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${formatInt(n)} B`;
  const units = ['KB', 'MB', 'GB'] as const;
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v).toString() : v.toFixed(1)} ${units[i]}`;
}

/** "2026-11-26T10:00:00Z" -> "Nov 2026" */
export function formatMonthYear(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? '?'} ${m[1]}`;
}

/** "2026-11-26T10:00:00Z" -> "2026-11-26" */
export function formatDateISO(iso: string): string {
  return iso.slice(0, 10);
}

/** "2026-11-26" -> "26 Nov 2026" */
export function formatDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? '?'} ${m[1]}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatInt(n)} ${n === 1 ? one : many}`;
}
