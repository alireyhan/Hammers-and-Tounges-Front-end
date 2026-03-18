import { createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/interceptors/admin.service';
import { toast } from 'react-toastify';

// Async Thunks
export const fetchAdminDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboard();
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch dashboard data';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const performUserAction = createAsyncThunk(
  'admin/performUserAction',
  async (actionData, { rejectWithValue }) => {
    try {
      const response = await adminService.performUserAction(actionData);
      toast.success(
        `User action "${actionData.type}" performed successfully!`
      );
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to perform user action';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const assignAuctionToManager = createAsyncThunk(
  'admin/assignAuctionToManager',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await adminService.assignAuctionToManager(
        assignmentData
      );
      toast.success('Auction assigned to manager successfully!');
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to assign auction';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const fetchUsersList = createAsyncThunk(
  'admin/fetchUsersList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsersList(params);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch users list';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'admin/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getCategories();
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

export const createCategory = createAsyncThunk(
  'admin/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await adminService.createCategory(categoryData);
      toast.success('Category created successfully!');
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create category';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const updateCategory = createAsyncThunk(
  'admin/updateCategory',
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateCategory(categoryId, categoryData);
      toast.success('Category updated successfully!');
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update category';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'admin/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await adminService.deleteCategory(categoryId);
      toast.success('Category deleted successfully!');
      return categoryId;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete category';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted successfully!');
      return userId;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete user';
      toast.error(message);
      return rejectWithValue(error.response?.data || { message });
    }
  }
);