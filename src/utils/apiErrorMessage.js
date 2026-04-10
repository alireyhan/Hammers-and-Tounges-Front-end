/**
 * Turn DRF / backend error payloads into a single line for toasts.
 * Handles Python repr strings like [ErrorDetail(string='...', code='invalid')].
 */

export function humanizeErrorDetailString(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (!t.includes('ErrorDetail')) return t;

  const parts = [];
  const reSingle = /ErrorDetail\(string='([^']*)'/g;
  let m;
  while ((m = reSingle.exec(t)) !== null) {
    parts.push(m[1]);
  }
  if (parts.length === 0) {
    const reDouble = /ErrorDetail\(string="((?:[^"\\]|\\.)*)"/g;
    while ((m = reDouble.exec(t)) !== null) {
      parts.push(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
  }
  return parts.length > 0 ? parts.join(' ') : t;
}

export function flattenApiDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return humanizeErrorDetailString(detail);
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return humanizeErrorDetailString(item);
        if (item != null && typeof item === 'object') {
          const inner =
            typeof item.string === 'string'
              ? item.string
              : typeof item.msg === 'string'
                ? item.msg
                : typeof item.message === 'string'
                  ? item.message
                  : '';
          return inner ? humanizeErrorDetailString(inner) : '';
        }
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  if (typeof detail === 'object') {
    if (typeof detail.string === 'string') return humanizeErrorDetailString(detail.string);
    if (typeof detail.msg === 'string') return humanizeErrorDetailString(detail.msg);
    if (typeof detail.message === 'string') return humanizeErrorDetailString(detail.message);
  }
  return '';
}

function joinErrorArray(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .map((item) => {
      if (typeof item === 'string') return humanizeErrorDetailString(item);
      if (item != null && typeof item === 'object') return flattenApiDetail(item);
      return '';
    })
    .filter(Boolean)
    .join('. ')
    .trim();
}

/**
 * Message for failed place-bid API (Redux thunk toast).
 */
export function messageFromBuyerPlaceBidError(res, fallback = 'Failed to place bid') {
  if (res == null) return fallback;
  if (typeof res === 'string') return humanizeErrorDetailString(res) || fallback;
  if (typeof res !== 'object') return fallback;

  const fromDetail = flattenApiDetail(res.detail);
  if (fromDetail) return fromDetail;

  if (typeof res.message === 'string' && res.message.trim()) {
    return humanizeErrorDetailString(res.message);
  }
  if (typeof res.error === 'string' && res.error.trim()) {
    return humanizeErrorDetailString(res.error);
  }

  const nonField = joinErrorArray(res.non_field_errors);
  if (nonField) return nonField;

  for (const key of ['amount', 'lot_id', 'bid']) {
    const joined = joinErrorArray(res[key]);
    if (joined) return joined;
  }

  return fallback;
}

const PREFERRED_FIELD_KEYS = ['email', 'phone', 'password', 'amount', 'lot_id', 'bid'];

/**
 * Generic API error body → one line (staff, wallet, profile, deposits, etc.).
 */
export function messageFromApiErrorResponse(res, fallback = 'Something went wrong') {
  if (res == null) return fallback;
  if (typeof res === 'string') return humanizeErrorDetailString(res) || fallback;
  if (typeof res !== 'object') return fallback;

  const fromDetail = flattenApiDetail(res.detail);
  if (fromDetail) return fromDetail;

  if (typeof res.message === 'string' && res.message.trim()) {
    return humanizeErrorDetailString(res.message);
  }
  if (typeof res.error === 'string' && res.error.trim()) {
    return humanizeErrorDetailString(res.error);
  }

  const nonField = joinErrorArray(res.non_field_errors);
  if (nonField) return nonField;

  for (const key of PREFERRED_FIELD_KEYS) {
    const v = res[key];
    if (Array.isArray(v)) {
      const j = joinErrorArray(v);
      if (j) return j;
    } else if (typeof v === 'string' && v.trim()) {
      return humanizeErrorDetailString(v);
    }
  }

  const skip = new Set(['detail', 'message', 'error', 'non_field_errors', ...PREFERRED_FIELD_KEYS]);
  for (const [key, val] of Object.entries(res)) {
    if (skip.has(key)) continue;
    if (Array.isArray(val)) {
      const j = joinErrorArray(val);
      if (j) return j;
    } else if (typeof val === 'string' && val.trim()) {
      return humanizeErrorDetailString(val);
    }
  }

  return fallback;
}

/**
 * Axios error → user-visible string (uses response body when present).
 */
export function messageFromAxiosError(err, fallback = 'Something went wrong') {
  const fromData = messageFromApiErrorResponse(err?.response?.data, '');
  if (fromData) return fromData;
  const axiosMsg = err?.message;
  if (typeof axiosMsg === 'string' && axiosMsg.trim()) {
    if (/^Request failed with status code \d+$/i.test(axiosMsg)) {
      return fallback;
    }
    return humanizeErrorDetailString(axiosMsg) || axiosMsg;
  }
  return fallback;
}
