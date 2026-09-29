import { api } from './api';
import { ApiResponse, AnalyticsOverview } from '../types';

export const analyticsApi = {
  getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
    return api.get('/analytics/overview');
  },

  getCategories: async (): Promise<ApiResponse<{ category: string; count: number }[]>> => {
    return api.get('/analytics/categories');
  },

  getDepartments: async (): Promise<ApiResponse<any[]>> => {
    return api.get('/analytics/departments');
  },

  getPriorities: async (): Promise<ApiResponse<{ priority: string; count: number }[]>> => {
    return api.get('/analytics/priorities');
  },

  getRecurring: async (days: number = 30): Promise<ApiResponse<any[]>> => {
    return api.get(`/analytics/recurring?days=${days}`);
  },

  getHotspots: async (days: number = 30): Promise<ApiResponse<any>> => {
    return api.get(`/analytics/hotspots?days=${days}`);
  }
};
