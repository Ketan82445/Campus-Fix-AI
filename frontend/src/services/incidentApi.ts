import { api } from './api';
import { ApiResponse, Incident } from '../types';

export const incidentApi = {
  getActive: async (): Promise<ApiResponse<Incident[]>> => {
    return api.get('/incidents');
  },

  getById: async (id: string): Promise<ApiResponse<Incident>> => {
    return api.get(`/incidents/${id}`);
  },

  create: async (data: Partial<Incident> & { complaintIds?: string[] }): Promise<ApiResponse<Incident>> => {
    return api.post('/incidents', data);
  },

  linkComplaints: async (incidentId: string, complaintIds: string[]): Promise<ApiResponse<Incident>> => {
    return api.post(`/incidents/${incidentId}/link`, { complaintIds });
  },

  resolve: async (incidentId: string, cascade: boolean): Promise<ApiResponse<Incident>> => {
    return api.post(`/incidents/${incidentId}/resolve`, { cascade });
  }
};
