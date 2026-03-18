
import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

export const adminService = {
  // Get Admin Dashboard Data
  getDashboard: async () => {
    try {
      const { data } = await apiClient.get(API_ROUTES.ADMIN_DASHBOARD);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // User Actions (Verify Seller, Promote to Manager, etc.)
  performUserAction: async (actionData) => {
    try {
      const { data } = await apiClient.post(
        API_ROUTES.ADMIN_USER_ACTION,
        actionData
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Assign Auction to Manager
  assignAuctionToManager: async (assignmentData) => {
    try {
      const { data } = await apiClient.post(
        API_ROUTES.ADMIN_ASSIGN_AUCTION,
        assignmentData
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get List of Users
  getUsersList: async (params = {}) => {
    try {
      const queryParams = {
        page: params.page || 1,
        page_size: params.page_size || 10,
        ...params,
      };
      const { data } = await apiClient.get(API_ROUTES.ADMIN_USERS_LIST, {
        params: queryParams,
      });
      // Normalize response: support both Django-style (count, next, previous, results)
      // and custom (total_pages, has_next, has_previous, current_page, results)
      const results = (data && data.results) ? data.results : (Array.isArray(data) ? data : []);
      const count = (data && data.count != null) ? data.count : results.length;
      const pageSize = queryParams.page_size || 10;
      const currentPage = (data && data.current_page != null) ? data.current_page : (queryParams.page || 1);
      const totalPages = (data && data.total_pages != null) ? data.total_pages : (Math.ceil((count || 1) / pageSize) || 1);
      const hasNext = (data && data.has_next != null) ? data.has_next : (data && data.next != null && data.next !== '');
      const hasPrevious = (data && data.has_previous != null) ? data.has_previous : (data && data.previous != null && data.previous !== '');

      return {
        results,
        count,
        total_pages: totalPages,
        current_page: currentPage,
        has_next: hasNext,
        has_previous: hasPrevious,
      };
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get Categories List
  getCategories: async () => {
    try {
      const { data } = await apiClient.get(API_ROUTES.FETCH_CATEGORIES);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Create Category
  createCategory: async (categoryData) => {
    try {
      const { data } = await apiClient.post(API_ROUTES.CREATE_CATEGORY, categoryData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Update Category
  updateCategory: async (categoryId, categoryData) => {
    try {
      // Some APIs use POST for updates, others use PUT/PATCH
      // Try PUT first (RESTful standard), fallback to POST if needed
      const { data } = await apiClient.put(`${API_ROUTES.UPDATE_CATEGORY + categoryId}/`, categoryData);
      return data;
      // try {
      // } catch (putError) {
        // // If PUT returns 405 (Method Not Allowed), try POST
        // if (putError.response?.status === 405) {
        //   const { data } = await apiClient.post(`/api/auctions/categories/${categoryId}/`, categoryData);
        //   return data;
        // }
      //   throw putError;
      // }
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Delete Category
  deleteCategory: async (categoryId) => {
    try {
      const { data } = await apiClient.delete(`${ API_ROUTES.DELETE_CATEGORY + categoryId}/`);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Get Auction Listings
  getAuctionListings: async (params = {}) => {
    try {
      const { data } = await apiClient.get(API_ROUTES.AUCTION_LISTINGS, {
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

  // Get Single Auction by ID
  getAuctionById: async (auctionId) => {
    try {
      const { data } = await apiClient.get(`${API_ROUTES.AUCTION_LISTINGS}${auctionId}/`);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Update Manager/User Details
  updateUser: async (userId, userData) => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== null && userData[key] !== undefined && userData[key] !== '') {
          if (key === 'image' && userData[key] instanceof File) {
            formData.append(key, userData[key]);
          } else {
            formData.append(key, userData[key]);
          }
        }
      });
      const { data } = await apiClient.patch(
        `${API_ROUTES.ADMIN_UPDATE_USER}${userId}/update/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Create Manager/Staff (FormData for consistency with updateUser - backend may expect multipart)
  createStaff: async (staffData) => {
    try {
      const formData = new FormData();
      Object.keys(staffData).forEach((key) => {
        const value = staffData[key];
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, typeof value === 'string' ? value.trim() : value);
        }
      });
      const { data } = await apiClient.post(API_ROUTES.ADMIN_CREATE_STAFF, formData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Create Manager (POST form-data to user-management)
  createManager: async (managerData) => {
    try {
      const formData = new FormData();
      formData.append('role', 'manager');
      formData.append('email', managerData.email?.trim() || '');
      formData.append('password', managerData.password?.trim() || '');
      if (managerData.first_name) formData.append('first_name', managerData.first_name.trim());
      if (managerData.last_name) formData.append('last_name', managerData.last_name.trim());
      if (managerData.display_name) formData.append('display_name', managerData.display_name.trim());
      if (managerData.phone) formData.append('phone', managerData.phone.trim());

      const { data } = await apiClient.postForm(API_ROUTES.ADMIN_USER_MANAGEMENT, formData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Create Clerk (same API as manager creation; role differs)
  createClerk: async (clerkData) => {
    try {
      const formData = new FormData();
      formData.append('role', 'clerk');
      formData.append('email', clerkData.email?.trim() || '');
      formData.append('password', clerkData.password?.trim() || '');
      if (clerkData.first_name) formData.append('first_name', clerkData.first_name.trim());
      if (clerkData.last_name) formData.append('last_name', clerkData.last_name.trim());
      if (clerkData.display_name) formData.append('display_name', clerkData.display_name.trim());
      if (clerkData.phone) formData.append('phone', clerkData.phone.trim());

      const { data } = await apiClient.postForm(API_ROUTES.ADMIN_USER_MANAGEMENT, formData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Create Seller (POST form-data to user-management)
  createSeller: async (sellerData) => {
    try {
      const formData = new FormData();
      formData.append('role', 'seller');
      formData.append('email', sellerData.email?.trim() || '');
      formData.append('password', sellerData.password?.trim() || '');
      if (sellerData.first_name) formData.append('first_name', sellerData.first_name.trim());
      if (sellerData.last_name) formData.append('last_name', sellerData.last_name.trim());
      if (sellerData.display_name) formData.append('display_name', sellerData.display_name.trim());
      if (sellerData.phone) formData.append('phone', sellerData.phone.trim());
      if (sellerData.image instanceof File) formData.append('image', sellerData.image);

      // Use postForm so axios sets multipart/form-data with proper boundary (avoids 415)
      const { data } = await apiClient.postForm(API_ROUTES.ADMIN_USER_MANAGEMENT, formData);
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Update Seller (PATCH form-data - API requires multipart for all updates)
  updateSeller: async (userId, sellerData) => {
    try {
      const formData = new FormData();
      Object.keys(sellerData).forEach((key) => {
        const value = sellerData[key];
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'image' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, typeof value === 'string' ? value.trim() : value);
          }
        }
      });

      const { data } = await apiClient.patch(
        `${API_ROUTES.ADMIN_USER_MANAGEMENT}${userId}/`,
        formData
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Soft-delete user (backend sets is_active: false)
  deleteUser: async (userId) => {
    try {
      const { data } = await apiClient.delete(
        `${API_ROUTES.ADMIN_USER_MANAGEMENT}${userId}/`
      );
      return data;
    } catch (error) {
      if (error.isNetworkError) {
        throw new Error('Unable to connect to server. Please try again later.');
      }
      throw error;
    }
  },

  // Toggle Category Active/Inactive Status
  toggleCategory: async (categoryId, categoryData) => {
    try {
      const { data } = await apiClient.post(
        `${API_ROUTES.TOGGLE_CATEGORY}${categoryId}/toggle/`,
        categoryData
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