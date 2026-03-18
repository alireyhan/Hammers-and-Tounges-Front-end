import { createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/interceptors/admin.service';
import { toast } from 'react-toastify';

export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await adminService.getUserPermissions(userId);
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch permissions';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

