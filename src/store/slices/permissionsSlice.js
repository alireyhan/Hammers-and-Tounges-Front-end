import { createSlice } from '@reduxjs/toolkit';
import { fetchUserPermissions } from '../actions/permissionsActions';

const initialState = {
  features: null,
  isLoading: false,
  error: null,
  lastFetchedUserId: null,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearPermissions: (state) => {
      state.features = null;
      state.error = null;
      state.isLoading = false;
      state.lastFetchedUserId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        // Prevent stale permissions from keeping tabs visible during refresh.
        state.features = null;
        state.lastFetchedUserId = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.lastFetchedUserId = action.meta.arg;
        state.features = action.payload?.feature_permissions || null;
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload || 'Failed to load permissions';
        // Hide access-controlled UI on failed fetch.
        state.features = null;
        state.lastFetchedUserId = null;
      });
  },
});

export const { clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;

