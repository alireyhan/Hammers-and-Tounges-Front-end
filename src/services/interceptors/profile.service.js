
import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

/**
 * Normalize profile API response - handles different backend response structures.
 * Backend may return: { first_name, ... } | { data: { ... } } | { user: {...}, profile: {...} }
 */
function normalizeProfileResponse(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // Already flat with expected fields
  if (raw.first_name !== undefined || raw.email !== undefined || raw.display_name !== undefined) {
    return raw;
  }
  // Nested under "data"
  if (raw.data && typeof raw.data === 'object') {
    return normalizeProfileResponse(raw.data);
  }
  // Nested under "profile" - merge top-level/user with profile
  if (raw.profile && typeof raw.profile === 'object') {
    const base = raw.user || raw;
    return { ...base, ...raw.profile };
  }
  // Nested under "user"
  if (raw.user && typeof raw.user === 'object') {
    return { ...raw.user, ...(raw.profile || {}) };
  }
  // full_name fallback - split into first_name/last_name if missing
  if (raw.full_name && !raw.first_name && !raw.last_name) {
    const parts = String(raw.full_name).trim().split(/\s+/);
    return {
      ...raw,
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || '',
    };
  }
  return raw;
}

/** Unwrap nested wallet shapes from the API (same as mobile buyerService.getWallet). */
function normalizeWalletPayload(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const hasBalances =
    raw.available_balance != null ||
    raw.availableBalance != null ||
    raw.bidding_power != null ||
    raw.biddingPower != null ||
    raw.locked_balance != null ||
    raw.lockedBalance != null;
  if (hasBalances) return raw;
  if (raw.wallet && typeof raw.wallet === "object") {
    const inner = normalizeWalletPayload(raw.wallet);
    if (inner) return inner;
  }
  if (raw.data && typeof raw.data === "object") {
    const inner = normalizeWalletPayload(raw.data);
    if (inner) return inner;
  }
  return raw;
}

function appendFormData(formData, data, parentKey = null) {
  Object.keys(data).forEach(key => {
    const value = data[key];
    const formKey = parentKey ? `${parentKey}[${key}]` : key;

    if (value instanceof File) {
      formData.append(formKey, value);
    } else if (value !== null && typeof value === 'object') {
      appendFormData(formData, value, formKey); // recursive for nested objects
    } else if (value !== undefined && value !== null) {
      formData.append(formKey, value);
    }
  });
}

export const profileService = {
  getProfile: async () => {
    // Try /users/me/ first (common for current user, no ID in path); fallback to /users/profile/
    try {
      const { data } = await apiClient.get(API_ROUTES.PROFILE_ME || API_ROUTES.PROFILE);
      return normalizeProfileResponse(data) || data;
    } catch (err) {
      if (API_ROUTES.PROFILE && API_ROUTES.PROFILE !== API_ROUTES.PROFILE_ME) {
        try {
          const { data } = await apiClient.get(API_ROUTES.PROFILE);
          return normalizeProfileResponse(data) || data;
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    const formData = new FormData();
    // Object.keys(profileData).forEach((key) => {
    //   if (profileData[key] !== null && profileData[key] !== undefined) {
    //     if (profileData[key] instanceof File) {
    //       formData.append(key, profileData[key]);
    //     } else {
    //       formData.append(key, profileData[key]);
    //     }
    //   }
    // });

    appendFormData(formData, profileData);

    const { data } = await apiClient.patch(API_ROUTES.PROFILE_UPDATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizeProfileResponse(data) || data;
  },

  deleteProfile: async () => {
    const { data } = await apiClient.delete(API_ROUTES.PROFILE_DELETE);
    return data;
  },

  getWallet: async () => {
    const { data } = await apiClient.get(API_ROUTES.WALLET);
    return normalizeWalletPayload(data) ?? data;
  },

  /** GET /payments/history/ — list shape may be array, { results }, { data }, etc. */
  getPaymentsHistory: async () => {
    const { data } = await apiClient.get(API_ROUTES.PAYMENTS_HISTORY);
    console.log('[payments/history] API response:', data);
    return data;
  },

  deposit: async ({ amount, cell_number }) => {
    const payload = {
      amount: String(amount),
      cell_number: String(cell_number),
    };
    const { data } = await apiClient.post(API_ROUTES.DEPOSIT, payload);
    return data;
  },
};