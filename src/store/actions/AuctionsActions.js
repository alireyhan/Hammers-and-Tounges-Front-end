// fetchAuctionDetail, fetchCategories, getAuctions, getCategoryDetail
import { createAsyncThunk } from '@reduxjs/toolkit';
import { auctionService } from '../../services/interceptors/auction.service';
import { toast } from 'react-toastify';

const EVENTS_CACHE_TTL_MS = 5 * 60 * 1000;

export const fetchAuctionsList = createAsyncThunk(
  'auctions/fetchAuctionsList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await auctionService.getAuctions(params);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch auctions list';
      
      // Don't show toast for 401 errors (handled by interceptor)
      if (error.response?.status !== 401) {
        toast.error(message);
      }
      
      return rejectWithValue({ 
        message, 
        status: error.response?.status,
        data: error.response?.data 
      });
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'seller/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auctionService.getCategories();
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch categories';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Guest Home loops with { page: n } — keep single-page responses.
      // Buyer dashboard uses {} — load every page (matches mobile app).
      const hasExplicitPage =
        params != null && Object.prototype.hasOwnProperty.call(params, 'page');
      if (hasExplicitPage) {
        const response = await auctionService.getEvents(params);
        return { ...response, fetchedAt: Date.now() };
      }
      const { page: _omit, forceRefresh = false, ...rest } = params || {};
      const results = await auctionService.fetchAllEvents(rest, { forceRefresh });
      return {
        results,
        count: results.length,
        next: null,
        previous: null,
        fetchedAt: Date.now(),
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch events';
      if (error.response?.status !== 401) {
        toast.error(message);
      }
      return rejectWithValue({
        message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  },
  {
    condition: (params = {}, { getState }) => {
      const hasExplicitPage =
        params != null && Object.prototype.hasOwnProperty.call(params, 'page');
      if (hasExplicitPage) return true;
      if (params?.forceRefresh) return true;

      const buyerState = getState()?.buyer;
      const hasLoaded = buyerState?.eventsLoaded;
      const lastFetched = buyerState?.eventsLastFetched || 0;
      if (!hasLoaded || !lastFetched) return true;

      return Date.now() - lastFetched >= EVENTS_CACHE_TTL_MS;
    },
  }
);

export const fetchCategoryDetail = createAsyncThunk(
  'all/fetchCategoryDetail',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await auctionService.getCategoryDetail(categoryId);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch category details';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);