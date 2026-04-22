/**
 * Price / amount fields: digits and at most one decimal point (no e/E/+/- from type="number").
 */
export function sanitizeDecimalPriceInput(raw) {
  if (raw == null || raw === '') return '';
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return parts[0] + '.' + parts.slice(1).join('');
}

/** Whole numbers only (mileage, counts, range integers). */
export function sanitizeDigitsOnly(raw, maxLen) {
  if (raw == null || raw === '') return '';
  let d = String(raw).replace(/\D/g, '');
  if (maxLen != null && maxLen > 0) d = d.slice(0, maxLen);
  return d;
}

/** Model year etc. — digits only, capped length (default 4). */
export function sanitizeYearInput(raw, maxLen = 4) {
  return sanitizeDigitsOnly(raw, maxLen);
}
