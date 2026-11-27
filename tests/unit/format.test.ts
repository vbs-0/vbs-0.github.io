import { describe, expect, it } from 'vitest';
import { formatBytes, formatDateISO, formatDay, formatInt, formatMonthYear, plural } from '@/lib/format';

describe('format', () => {
  it('groups integers by thousands', () => {
    expect(formatInt(0)).toBe('0');
    expect(formatInt(999)).toBe('999');
    expect(formatInt(24741)).toBe('24,741');
    expect(formatInt(1004038)).toBe('1,004,038');
    expect(formatInt(-1500)).toBe('-1,500');
  });
  it('formats byte sizes in binary units', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(24741)).toBe('24.2 KB');
    expect(formatBytes(16938208)).toBe('16.2 MB');
    expect(formatBytes(1024 * 1024 * 150)).toBe('150 MB');
  });
  it('formats dates without a locale', () => {
    expect(formatMonthYear('2026-11-26T10:00:00Z')).toBe('Nov 2026');
    expect(formatDateISO('2026-11-26T10:00:00Z')).toBe('2026-11-26');
    expect(formatDay('2026-08-05')).toBe('5 Aug 2026');
    expect(formatMonthYear('not a date')).toBe('not a date');
  });
  it('pluralises', () => {
    expect(plural(1, 'repository', 'repositories')).toBe('1 repository');
    expect(plural(33, 'repository', 'repositories')).toBe('33 repositories');
    expect(plural(2, 'test')).toBe('2 tests');
  });
});
