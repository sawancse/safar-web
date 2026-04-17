export function formatPaise(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export function formatPricingUnit(unit: 'NIGHT' | 'HOUR'): string {
  return unit === 'HOUR' ? 'hr' : 'night';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Human date in Indian English: "Mon, 20 Apr 2026".
 * Accepts "2026-04-20", ISO datetimes, or Date objects. Returns '—' on bad input.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string'
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00:00' : value)
    : value;
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : '—';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

/** "Mon, 20 Apr 2026 · 12:00 PM" — pass the raw date and time separately, or a single ISO string. */
export function formatDateTime(date: string | Date | null | undefined, time?: string | null): string {
  const d = formatDate(date);
  if (d === '—') return '—';
  if (time && time.trim()) return `${d} · ${formatTime12(time)}`;
  if (date instanceof Date || (typeof date === 'string' && date.includes('T'))) {
    const dt = typeof date === 'string' ? new Date(date) : date;
    if (!isNaN(dt.getTime())) {
      const hhmm = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${d} · ${hhmm}`;
    }
  }
  return d;
}

/** "18:00" or "18:00:00" → "6:00 PM". Passes through anything already containing AM/PM. */
export function formatTime12(time: string): string {
  if (!time) return '';
  if (/am|pm/i.test(time)) return time;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}
