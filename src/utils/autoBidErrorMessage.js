import { flattenApiDetail, humanizeErrorDetailString } from './apiErrorMessage';

/**
 * User-facing copy when auto-bid fails due to wallet / bidding power (or unknown 400).
 */
export const AUTO_BID_BALANCE_MESSAGE =
  'Your bidding power is insufficient for this auto-bid maximum. Add funds to your wallet or reduce the maximum amount.';

const BALANCE_HINT =
  /insufficient|bidding\s*power|not\s+enough|balance|wallet|funds?|exceed|available\s+deposit|deposit\s+required/i;

const GENERIC_AXIOS_STATUS = /Request failed with status code \d+/i;

function collectApiErrorStrings(data) {
  if (data == null) return '';
  if (typeof data === 'string') return humanizeErrorDetailString(data);
  if (typeof data !== 'object') return '';

  const fromDetail = flattenApiDetail(data.detail);
  if (fromDetail) return fromDetail;

  if (typeof data.message === 'string') return humanizeErrorDetailString(data.message);
  if (typeof data.error === 'string') return humanizeErrorDetailString(data.error);
  if (Array.isArray(data.non_field_errors)) {
    const s = data.non_field_errors
      .map((x) => (typeof x === 'string' ? humanizeErrorDetailString(x) : flattenApiDetail(x)))
      .filter(Boolean)
      .join(' ')
      .trim();
    if (s) return s;
  }
  const parts = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === 'detail' || key === 'message' || key === 'error') continue;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'string') parts.push(humanizeErrorDetailString(item));
      });
    } else if (typeof val === 'string') {
      parts.push(humanizeErrorDetailString(val));
    }
  }
  return parts.join(' ').trim();
}

/**
 * Message for failed create/update auto-bid (toast).
 */
export function getAutoBidSaveErrorMessage(err, fallback = 'Could not save auto-bid') {
  const fromApi = collectApiErrorStrings(err?.response?.data);
  if (fromApi) {
    if (BALANCE_HINT.test(fromApi)) return AUTO_BID_BALANCE_MESSAGE;
    return fromApi;
  }
  const status = err?.response?.status;
  const axiosMsg = err?.message;
  if (status === 400 && typeof axiosMsg === 'string' && GENERIC_AXIOS_STATUS.test(axiosMsg)) {
    return AUTO_BID_BALANCE_MESSAGE;
  }
  if (typeof axiosMsg === 'string' && axiosMsg && !GENERIC_AXIOS_STATUS.test(axiosMsg)) {
    return axiosMsg;
  }
  return fallback;
}
