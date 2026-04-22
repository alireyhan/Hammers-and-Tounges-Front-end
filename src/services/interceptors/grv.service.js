import apiClient from '../api.service';
import { API_ROUTES } from '../../config/api.config';

const base = API_ROUTES.AUCTIONS_GRV;

export const grvService = {
  /** GET /auctions/grv/?lot=22 */
  list: async (params = {}) => {
    const { data } = await apiClient.get(base, { params });
    return data;
  },

  /** POST /auctions/grv/ */
  create: async (payload) => {
    const { data } = await apiClient.post(base, payload);
    return data;
  },

  /** PATCH /auctions/grv/{id}/ */
  update: async (id, payload) => {
    const { data } = await apiClient.patch(`${base}${id}/`, payload);
    return data;
  },

  /** DELETE /auctions/grv/{id}/ */
  delete: async (id) => {
    await apiClient.delete(`${base}${id}/`);
  },
};
