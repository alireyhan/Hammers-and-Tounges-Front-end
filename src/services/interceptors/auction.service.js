import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

const EVENTS_CACHE_TTL_MS = 30 * 1000;
let eventsCache = {
  key: '',
  data: null,
  expiresAt: 0,
  promise: null,
};

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
};

export const auctionService = {
  // Get lots for an event (with pagination)
  getLots: async (params) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LOTS, {
        params,
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  /** Every page of lots (for admin GRV and similar). */
  fetchAllLots: async (extraParams = {}) => {
    try {
      let results = [];
      let nextPage = 1;
      let hasMore = true;
      while (hasMore) {
        const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LOTS, {
          params: { page_size: 100, ...extraParams, page: nextPage },
        });
        results = [...results, ...(data?.results || [])];
        hasMore = !!data?.next;
        nextPage += 1;
      }
      return results;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Get all auction events (single page — see fetchAllEvents for full list)
  getEvents: async (params) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_EVENTS, {
        params,
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  /**
   * Load every page of events (same behavior as the mobile staff dashboard).
   * Using only page 1 omits events when the API paginates.
   */
  fetchAllEvents: async (extraParams = {}, options = {}) => {
    const { forceRefresh = false } = options;
    const paramsKey = stableStringify(extraParams);
    const now = Date.now();

    // Return fresh cached data to avoid repeated endpoint bursts.
    if (
      !forceRefresh &&
      eventsCache.key === paramsKey &&
      eventsCache.data &&
      now < eventsCache.expiresAt
    ) {
      return eventsCache.data;
    }

    // Reuse an in-flight full-fetch for identical params.
    if (
      !forceRefresh &&
      eventsCache.key === paramsKey &&
      eventsCache.promise
    ) {
      return eventsCache.promise;
    }

    eventsCache.key = paramsKey;
    eventsCache.promise = (async () => {
      let results = [];
      let nextPage = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await apiClient.get(API_ROUTES.AUCTIONS_EVENTS, {
          params: { ...extraParams, page: nextPage },
        });
        results = [...results, ...(data.results || [])];
        hasMore = !!data.next;
        nextPage += 1;
      }

      eventsCache.data = results;
      eventsCache.expiresAt = Date.now() + EVENTS_CACHE_TTL_MS;
      return results;
    })();

    try {
      return await eventsCache.promise;
    } finally {
      eventsCache.promise = null;
    }
  },
  // Get single event by ID
  getEvent: async (eventId) => {
    try {
      const { data } = await apiClient.get(`${API_ROUTES.AUCTIONS_EVENTS}${eventId}/`);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Create auction event
  createEvent: async (eventData) => {
    try {
      const { data } = await apiClient.post(API_ROUTES.AUCTIONS_EVENTS, eventData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Update auction event
  updateEvent: async (eventId, eventData) => {
    try {
      const { data } = await apiClient.patch(
        `${API_ROUTES.AUCTIONS_EVENTS}${eventId}/`,
        eventData
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Delete auction event
  deleteEvent: async (eventId) => {
    try {
      await apiClient.delete(`${API_ROUTES.AUCTIONS_EVENTS}${eventId}/`);
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Get all auctions (with optional filters)
  getAuctions: async (params) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LIST, {
        params,
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Get all categories
  getCategories: async () => {
    try {
      const { data } = await apiClient.get(`${API_ROUTES.AUCTION_CATEGORIES}?_t=${Date.now()}`);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Get single lot by ID (direct endpoint)
  getLot: async (lotId) => {
    try {
      const { data } = await apiClient.get(`${API_ROUTES.AUCTIONS_LOTS}${lotId}/`);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get lot(s) via lots search API (GET /lots/?lot_id=...&event=...&category=...)
  // Use when you have lot_number from bid - returns first matching lot from results
  getLotByLotId: async (lotId, params = {}) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LOTS, {
        params: { lot_id: lotId, page_size: 1, ...params },
      });
      const results = data?.results ?? data;
      return Array.isArray(results) && results.length > 0 ? results[0] : null;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Create lot (multipart/form-data)
  createLot: async (formData) => {
    try {
      const { data } = await apiClient.post(API_ROUTES.AUCTIONS_LOTS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Patch lot status (PATCH to /api/auctions/lots/{id}/)
  patchLotStatus: async (lotId, status) => {
    try {
      const { data } = await apiClient.patch(
        `${API_ROUTES.AUCTIONS_LOTS}${lotId}/`,
        { status },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Update lot (PUT to /update/ with JSON body)
  updateLot: async (lotId, payload) => {
    try {
      const { data } = await apiClient.put(
        `${API_ROUTES.AUCTIONS_LOTS}${lotId}/update/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Delete lot (DELETE to same /update/ endpoint as update)
  deleteLot: async (lotId) => {
    try {
      await apiClient.delete(`${API_ROUTES.AUCTIONS_LOTS}${lotId}/update/`);
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get lot facets for filtering (scoped by event)
  // eventId is required - API returns event-specific facet data
  getLotsFacets: async (eventId) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTIONS_LOTS_FACETS, {
        params: { event: eventId },
      });
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get category detail
  getCategoryDetail: async (categoryId) => {
    try {
      const response = await apiClient.get(
        `${API_ROUTES.AUCTION_CATEGORY_DETAIL}${categoryId}/`
      );
      console.log('Category GET API response (direct):', response?.data);
      return response.data;
    } catch (error) {
      console.log('Category GET API error:', error?.response?.status, error?.response?.data);
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
};
