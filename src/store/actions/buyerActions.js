import { createAsyncThunk } from '@reduxjs/toolkit';
import { buyerService } from '../../services/interceptors/buyer.service';
import { toast } from 'react-toastify';

// Async Thunks
export const browseAuctions = createAsyncThunk(
  'buyer/browseAuctions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.browseAuctions();
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch auctions';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const placeBid = createAsyncThunk(
  'buyer/placeBid',
  async (bidData, { rejectWithValue }) => {
    try {
      const response = await buyerService.placeBid(bidData);
      console.log("response: ", response);
      
      toast.success('Bid placed successfully!');
      return response;
    } catch (error) {
      const res = error.response?.data;
      const message =
        (typeof res?.detail === 'string' ? res.detail : null) ||
        res?.message ||
        res?.error ||
        (Array.isArray(res?.non_field_errors) ? res.non_field_errors.join('. ') : null) ||
        (res?.amount && Array.isArray(res.amount) ? res.amount.join('. ') : null) ||
        (res?.lot_id && Array.isArray(res.lot_id) ? res.lot_id.join('. ') : null) ||
        (typeof res === 'object' ? JSON.stringify(res) : null) ||
        'Failed to place bid';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const fetchAuctionBids = createAsyncThunk(
  'buyer/fetchAuctionBids',
  async (arg, { rejectWithValue }) => {
    const lotId =
      typeof arg === 'object' && arg !== null && 'lotId' in arg ? arg.lotId : arg;
    const silent =
      typeof arg === 'object' && arg !== null && arg.silent === true;
    try {
      return await buyerService.getLotBids(lotId);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch bids';
      if (!silent) {
        toast.error(message);
      }
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const fetchMyBids = createAsyncThunk(
  'buyer/fetchMyBids',
  async (paramsOrUrl, { rejectWithValue }) => {
    try {
      const response = await buyerService.getMyBids(paramsOrUrl);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch your bids';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const getMyFavoriteAuctions = createAsyncThunk(
  'buyer/getMyFavoriteAuctions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await buyerService.getMyFavoriteAuctions(params);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch your bids';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const addToFavorite = createAsyncThunk(
  'buyer/addToFavorite',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await buyerService.addToFavorite(auctionId);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to add to favorites';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteFavorite = createAsyncThunk(
  'buyer/deleteFavorite',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await buyerService.deleteFromFavorite(auctionId);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to remove from favorites';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);