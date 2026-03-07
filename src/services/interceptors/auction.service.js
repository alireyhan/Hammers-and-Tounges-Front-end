import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

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
  // Get all auction events
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
      const { data } = await apiClient.get(API_ROUTES.AUCTION_CATEGORIES);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
  // Get single lot by ID
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
  // Create lot (multipart/form-data)
  createLot: async (formData) => {
    try {
      const { data } = await apiClient.post(API_ROUTES.AUCTIONS_LOTS, formData);
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

  // Get category detail
  getCategoryDetail: async (categoryId) => {
    try {
      const { data } = await apiClient.get(
        `${API_ROUTES.AUCTION_CATEGORY_DETAIL}${categoryId}/`
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },
};
