import { api } from './api';
import { ApiResponse, SLAStats, SLAConfig, Priority } from '../types';

export const slaApi = {
  getStats: async (): Promise<ApiResponse<SLAStats>> => {
    return api.get('/sla/stats');
  },

  checkEscalations: async (): Promise<
    ApiResponse<{ checkedCount: number; breachedCount: number; escalatedCount: number }>
  > => {
    return api.post('/sla/check-escalations');
  },

  getConfigs: async (): Promise<ApiResponse<SLAConfig[]>> => {
    return api.get('/sla/configs');
  },

  updateConfig: async (
    priority: Priority,
    data: { responseHours: number; resolutionHours: number }
  ): Promise<ApiResponse<SLAConfig>> => {
    return api.put(`/sla/configs/${priority}`, data);
  }
};
