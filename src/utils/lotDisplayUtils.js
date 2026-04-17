/**
 * Shared lot list / drawer display helpers (event bounds + bid vs starting price).
 */

export const parseLotAmount = (v) => {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

/**
 * Prefer API fields: event_start_time, event_end_time, then nested event / legacy keys.
 */
export const resolveLotEventBounds = (lot, eventStartTime, eventEndTime) => {
  const nested =
    lot?.auction_event && typeof lot.auction_event === 'object'
      ? lot.auction_event
      : lot?.event && typeof lot.event === 'object'
        ? lot.event
        : null;

  const start =
    lot?.event_start_time ??
    eventStartTime ??
    lot?.start_date ??
    lot?.start_time ??
    lot?.startdate ??
    nested?.start_time ??
    nested?.start_date;

  const end =
    lot?.event_end_time ??
    eventEndTime ??
    lot?.end_date ??
    lot?.end_time ??
    lot?.enddate ??
    lot?.auction_end_time ??
    nested?.end_time ??
    nested?.end_date;

  return { start, end };
};

/**
 * If highest_bid is present and > 0, treat as current bid; else starting price (initial_price).
 */
export const getLotBidDisplay = (lot) => {
  const currency = lot?.currency || 'USD';
  const initial = parseLotAmount(lot?.initial_price) ?? 0;
  const hbRaw = lot?.highest_bid;
  const hb = parseLotAmount(hbRaw);
  const hasHighest =
    hbRaw != null && hbRaw !== '' && hb != null && hb > 0;

  if (hasHighest) {
    return { label: 'CURRENT BID', value: hb, currency };
  }

  const cp = parseLotAmount(lot?.current_price);
  if (cp != null && cp > initial) {
    return { label: 'CURRENT BID', value: cp, currency };
  }
  if ((lot?.total_bids ?? 0) > 0 && cp != null && cp > 0) {
    return { label: 'CURRENT BID', value: cp, currency };
  }

  return { label: 'STARTING PRICE', value: initial, currency };
};
