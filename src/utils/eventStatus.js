/**
 * Event objects from the list API may expose lifecycle under `status`, `event_status`,
 * or other keys. Dashboard filters must read the same field the detail views use.
 */

export function getRawEventStatus(event) {
  if (!event || typeof event !== 'object') return '';
  const v =
    event.status ??
    event.event_status ??
    event.state ??
    event.auction_status;
  return String(v ?? '').trim();
}

function inferStatusWhenMissing(event) {
  const now = Date.now();
  const endMs = event?.end_time ? new Date(event.end_time).getTime() : NaN;
  if (!Number.isNaN(endMs) && endMs <= now) return 'CLOSED';
  const startMs = event?.start_time ? new Date(event.start_time).getTime() : NaN;
  if (!Number.isNaN(startMs) && startMs <= now && (Number.isNaN(endMs) || endMs > now)) {
    return 'LIVE';
  }
  return 'SCHEDULED';
}

/**
 * Canonical values used by admin/manager filters: SCHEDULED | LIVE | CLOSING | CLOSED
 * (and manager "Completed" also treats COMPLETED API values as closing-like).
 */
export function normalizeEventStatusForFilter(event) {
  const raw = getRawEventStatus(event).toUpperCase();
  if (!raw) {
    return inferStatusWhenMissing(event);
  }
  if (['SCHEDULED', 'APPROVED', 'UPCOMING', 'PENDING', 'DRAFT'].includes(raw)) {
    return 'SCHEDULED';
  }
  if (raw === 'COMPLETED') return 'CLOSING';
  if (['LIVE', 'ACTIVE'].includes(raw)) return 'LIVE';
  if (['CLOSING', 'CLOSED'].includes(raw)) return raw;
  return raw;
}
