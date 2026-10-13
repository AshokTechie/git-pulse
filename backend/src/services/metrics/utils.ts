import type { PrRange } from '@prisma/client';

export type RangeKey = '7d' | '30d' | '90d' | '1y';
export const RANGE_KEYS: RangeKey[] = ['7d', '30d', '90d', '1y'];

export function toRangeKey(value: string | undefined | null, fallback: RangeKey = '30d'): RangeKey {
  if (value && (RANGE_KEYS as string[]).includes(value)) return value as RangeKey;
  return fallback;
}

export function toPrRange(range: RangeKey): PrRange {
  switch (range) {
    case '7d': return 'SEVEN_DAYS';
    case '90d': return 'NINETY_DAYS';
    case '1y': return 'ONE_YEAR';
    default: return 'THIRTY_DAYS';
  }
}

export function rangeStartDate(range: RangeKey): Date {
  const now = Date.now();
  return new Date(range === '7d' ? now - 7 * 86_400_000 : range === '30d' ? now - 30 * 86_400_000 : range === '90d' ? now - 90 * 86_400_000 : now - 365 * 86_400_000);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.max(1, (b.getTime() - a.getTime()) / 86_400_000);
}

export function hoursBetween(a: Date, b: Date): number {
  return Math.round(((b.getTime() - a.getTime()) / 3_600_000) * 10) / 10;
}

export function round(value: number | null | undefined, dp = 1): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Group a list of commits by contiguous ISO-week buckets. */
export function weekBuckets<T extends { date: Date }>(items: T[], start: Date, end: Date): { label: string; key: string; items: T[] }[] {
  const buckets: { label: string; key: string; items: T[] }[] = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  // align to start-of-ISO-week (Monday)
  cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
  while (cursor <= end) {
    const weekEnd = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    buckets.push({
      key: cursor.toISOString().slice(0, 10),
      label: `Week ${buckets.length + 1}`,
      items: [],
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  for (const item of items) {
    const day = new Date(item.date);
    const diffDays = Math.floor((new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()).getTime() - new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()).getTime()) / 86_400_000);
    const idx = Math.max(0, Math.floor(diffDays / 7));
    if (buckets[idx]) buckets[idx].items.push(item);
  }
  return buckets;
}

/** Group dates into month buckets labelled like "Jan", "Feb", ... */
export function monthBuckets(dates: Date[], start: Date, end: Date): { label: string; key: string; dates: Date[] }[] {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const buckets: { label: string; key: string; dates: Date[] }[] = [];
  const cursor = new Date(start.getUTCFullYear(), start.getUTCMonth(), 1);
  while (cursor <= end) {
    buckets.push({
      key: `${cursor.getUTCFullYear()}-${cursor.getUTCMonth() + 1}`,
      label: MONTHS[cursor.getUTCMonth()],
      dates: [],
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  for (const date of dates) {
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.dates.push(date);
  }
  return buckets;
}