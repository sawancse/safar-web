/**
 * 10-digit Indian mobile validator.
 * sanitizePhone strips non-digits and a leading 91/0 so paste-friendly input still ends up
 * as a bare 10-digit number that the backend / MSG91 expects.
 */
export function sanitizePhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidPhone(raw: string): boolean {
  const d = sanitizePhone(raw);
  return d.length === 10 && /^[6-9]\d{9}$/.test(d);
}

/** Returns a user-friendly error string, or '' when the value is valid (or empty). */
export function phoneError(raw: string, required = true): string {
  const d = sanitizePhone(raw);
  if (!d) return required ? 'Phone number is required' : '';
  if (d.length < 10) return `Enter ${10 - d.length} more digit${10 - d.length === 1 ? '' : 's'}`;
  if (d.length > 10) return 'Phone number cannot be more than 10 digits';
  if (!/^[6-9]/.test(d)) return 'Indian mobile numbers must start with 6, 7, 8, or 9';
  return '';
}
