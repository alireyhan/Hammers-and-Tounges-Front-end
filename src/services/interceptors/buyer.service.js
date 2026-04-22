
import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

export const buyerService = {
  // Place a bid (POST /auctions/bid/ with { lot_id, amount })
  placeBid: async (bidData) => {
    try {
      const amount = parseFloat(bidData.amount);
      const payload = {
        lot_id: Number(bidData.lot_id ?? bidData.auction_id),
        amount: isNaN(amount) ? 0 : Number(amount.toFixed(2)),
      };
      const { data } = await apiClient.post(API_ROUTES.PLACE_BID, payload);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  /** GET /api/auctions/auto-bids/my/ — paginated { results: [...] } or array */
  getMyAutoBids: async () => {
    try {
      const { data } = await apiClient.get('auctions/auto-bids/my/');
      if (Array.isArray(data)) return data;
      return data?.results ?? data?.data ?? [];
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  /** POST /api/auctions/lots/{lotId}/auto-bid/ — { max_amount } (same as mobile / Postman) */
  createAutoBid: async ({ lotId, maxAmount }) => {
    const amt = Number(maxAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      throw new Error('Enter a valid max amount');
    }
    const payload = { max_amount: Number(amt.toFixed(2)) };
    const { data } = await apiClient.post(
      `${API_ROUTES.AUCTIONS_LOTS}${Number(lotId)}/auto-bid/`,
      payload
    );
    return data;
  },

  /** Same lot-scoped URL as create */
  updateAutoBid: async (lotId, maxAmount) => {
    const amt = Number(maxAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      throw new Error('Enter a valid max amount');
    }
    const { data } = await apiClient.post(
      `${API_ROUTES.AUCTIONS_LOTS}${Number(lotId)}/auto-bid/`,
      { max_amount: Number(amt.toFixed(2)) }
    );
    return data;
  },

  /** DELETE /api/auctions/auto-bids/{id}/ */
  deleteAutoBid: async (autoBidId) => {
    await apiClient.delete(`auctions/auto-bids/${autoBidId}/`);
  },

  // Get bids for a lot (GET /auctions/lots/{id}/bids/)
  getLotBids: async (lotId) => {
    try {
      const { data } = await apiClient.get(
        `${API_ROUTES.AUCTIONS_LOTS}${lotId}/bids/`
      );
      return Array.isArray(data) ? data : data?.results ?? data?.bids ?? [];
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get all auctions (for browsing)
  browseAuctions: async () => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LIST);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get my bids (GET /bids/my/ with optional page, page_size)
  getMyBids: async (paramsOrUrl) => {
    try {
      let data;
      if (typeof paramsOrUrl === 'string' && paramsOrUrl.startsWith('http')) {
        const { data: res } = await apiClient.get(paramsOrUrl);
        data = res;
      } else {
        const params = typeof paramsOrUrl === 'object' ? paramsOrUrl : { page: 1, page_size: 10 };
        const { data: res } = await apiClient.get(API_ROUTES.BIDS_LIST, { params });
        data = res;
      }
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // GET /auctions/watchlist/?page=1&page_size=10
  getMyFavoriteAuctions: async (params = {}) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.WATCH_LIST, {
        params: { page: 1, page_size: 10, ...params },
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Add/remove from watchlist - same POST endpoint toggles (add if not in list, remove if in list)
  addToFavorite: async (id) => {
    let err;
    try {
      const { data } = await apiClient.post(`${API_ROUTES.AUCTION_LISTINGS}${id}/watchlist/`);
      return data;
    } catch (e) {
      err = e;
    }
    if (err?.isNetworkError) throw new Error('Unable to connect to server. Please try again later.');
    try {
      const { data } = await apiClient.post(`${API_ROUTES.AUCTIONS_LOTS}${id}/watchlist/`);
      return data;
    } catch {
      throw err;
    }
  },
  deleteFromFavorite: async (id) => {
    // Use same POST API as add - backend toggles on/off
    return buyerService.addToFavorite(id);
  },

};
