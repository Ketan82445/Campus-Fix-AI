import { api } from './api';
import { ApiResponse, ComplaintFeedback, TechnicianPerformance } from '../types';

export const feedbackApi = {
  submitFeedback: async (
    complaintId: string,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<ComplaintFeedback>> => {
    return api.post(`/feedback/${complaintId}`, { rating, comment });
  },

  getFeedback: async (complaintId: string): Promise<ApiResponse<ComplaintFeedback>> => {
    return api.get(`/feedback/${complaintId}`);
  },

  getTechnicianPerformance: async (technicianId: string): Promise<ApiResponse<TechnicianPerformance>> => {
    return api.get(`/feedback/technician/${technicianId}`);
  }
};
