import { createSlice } from '@reduxjs/toolkit';
import { assignAuctionToManager, fetchAdminDashboard, fetchUsersList, performUserAction, fetchCategories, deleteCategory, deleteUser } from '../actions/adminActions';

const initialState = {
  dashboard: null,
  users: [],
  categories: [],
  isLoading: false,
  isPerformingAction: false,
  isAssigning: false,
  error: null,
  actionSuccess: false,
};



// Admin Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearActionSuccess: (state) => {
      state.actionSuccess = false;
    },
    resetAdminState: (state) => {
      state.dashboard = null;
      state.users = [];
      state.error = null;
      state.actionSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch Admin Dashboard
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Perform User Action
    builder
      .addCase(performUserAction.pending, (state) => {
        state.isPerformingAction = true;
        state.error = null;
        state.actionSuccess = false;
      })
      .addCase(performUserAction.fulfilled, (state, action) => {
        state.isPerformingAction = false;
        state.actionSuccess = true;
      })
      .addCase(performUserAction.rejected, (state, action) => {
        state.isPerformingAction = false;
        state.error = action.payload;
        state.actionSuccess = false;
      });

    // Assign Auction to Manager
    builder
      .addCase(assignAuctionToManager.pending, (state) => {
        state.isAssigning = true;
        state.error = null;
      })
      .addCase(assignAuctionToManager.fulfilled, (state, action) => {
        state.isAssigning = false;
      })
      .addCase(assignAuctionToManager.rejected, (state, action) => {
        state.isAssigning = false;
        state.error = action.payload;
      });

    // Fetch Users List
    builder
      .addCase(fetchUsersList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersList.rejected, (state, action) => {
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
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove deleted category from the list
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete User (soft-delete: is_active=false)
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isPerformingAction = true;
        state.error = null;
        state.actionSuccess = false;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.isPerformingAction = false;
        state.actionSuccess = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isPerformingAction = false;
        state.error = action.payload;
        state.actionSuccess = false;
      });
  },
});

export const { clearAdminError, clearActionSuccess, resetAdminState } =
  adminSlice.actions;
export default adminSlice.reducer;