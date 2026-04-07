import { createSlice } from '@reduxjs/toolkit';
import { browseAuctions, fetchAuctionBids, fetchMyBids, placeBid } from '../actions/buyerActions';
import { fetchAuctionsList, fetchCategories, fetchEvents } from '../actions/AuctionsActions';

const initialState = {
  auctions: null,
  browseAuctionsList: [],
  auctionBids: [],
  myBids: [],
  categories: [],
  events: [],
  eventsLoading: false,
  eventsError: null,
  isLoading: false,
  isPlacingBid: false,
  error: null,
  bidSuccess: false,

  totalCount: 0,
  nextPage: null,
  prevPage: null,
  currentPage: 1,
};

// Buyer Slice
const buyerSlice = createSlice({
  name: 'buyer',
  initialState,
  reducers: {
    clearBuyerError: (state) => {
      state.error = null;
    },
    clearBidSuccess: (state) => {
      state.bidSuccess = false;
    },
    resetBuyerState: (state) => {
      state.auctions = [];
      state.auctionBids = [];
      state.myBids = [];
      state.error = null;
      state.bidSuccess = false;
    },
    setAuctionBidsFromWebSocket: (state, action) => {
      state.auctionBids = Array.isArray(action.payload) ? action.payload : [];
    },
  },
  extraReducers: (builder) => {
    // Browse Auctions
    builder
      .addCase(browseAuctions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(browseAuctions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.browseAuctionsList = action.payload;

        state.totalCount = action?.payload?.count ?? 0;
        state.nextPage = action?.payload?.next;
        state.prevPage = action?.payload?.previous;
      })
      .addCase(browseAuctions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    // All Auctions
    builder
      .addCase(fetchAuctionsList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuctionsList.fulfilled, (state, action) => {

        state.isLoading = false;
        state.auctions = action.payload;

        state.totalCount = action?.payload?.count ?? 0;
        state.nextPage = action?.payload?.next;
        state.prevPage = action?.payload?.previous;
      })
      .addCase(fetchAuctionsList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Place Bid
    builder
      .addCase(placeBid.pending, (state) => {
        state.isPlacingBid = true;
        state.error = null;
        state.bidSuccess = false;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.isPlacingBid = false;
        state.bidSuccess = true;
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.isPlacingBid = false;
        state.error = action.payload;
        state.bidSuccess = false;
      });

    // Fetch Auction Bids
    builder
      .addCase(fetchAuctionBids.pending, (state, action) => {
        const silent =
          typeof action.meta.arg === 'object' &&
          action.meta.arg !== null &&
          action.meta.arg.silent === true;
        if (silent) return;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuctionBids.fulfilled, (state, action) => {
        const silent =
          typeof action.meta.arg === 'object' &&
          action.meta.arg !== null &&
          action.meta.arg.silent === true;
        if (!silent) {
          state.isLoading = false;
        }
        state.auctionBids = action.payload;
      })
      .addCase(fetchAuctionBids.rejected, (state, action) => {
        const silent =
          typeof action.meta.arg === 'object' &&
          action.meta.arg !== null &&
          action.meta.arg.silent === true;
        if (silent) return;
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch My Bids
    builder
      .addCase(fetchMyBids.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBids.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBids = action.payload;
        
        state.totalCount = action?.payload?.count ?? 0;
        state.nextPage = action?.payload?.next;
        state.prevPage = action?.payload?.previous;
      })
      .addCase(fetchMyBids.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload?.filter(g => g?.is_active);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Events
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.eventsLoading = true;
        state.eventsError = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.eventsLoading = false;
        state.events = action.payload?.results || [];
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.eventsLoading = false;
        state.eventsError = action.payload;
      });
  },
});

export const { clearBuyerError, clearBidSuccess, resetBuyerState, setAuctionBidsFromWebSocket } =
  buyerSlice.actions;
export default buyerSlice.reducer;