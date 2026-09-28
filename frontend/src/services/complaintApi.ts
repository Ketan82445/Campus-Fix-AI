import { api } from './api';
import { ApiResponse, Complaint, PaginatedResponse, Status, Category, Priority } from '../types';

export const complaintApi = {
  create: async (data: {
    title: string;
    description: string;
    location: string;
    category?: Category;
    priority?: Priority;
  }): Promise<ApiResponse<Complaint>> => {
    return api.post('/complaints', data);
  },

  getMany: async (params?: {
    page?: number;
    limit?: number;
    status?: Status;
    category?: Category;
    priority?: Priority;
    departmentId?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Complaint>>> => {
    return api.get('/complaints', { params });
  },

  getById: async (id: string): Promise<ApiResponse<Complaint>> => {
    return api.get(`/complaints/${id}`);
  },

  updateStatus: async (id: string, status: Status, reason?: string): Promise<ApiResponse<Complaint>> => {
    return api.post(`/complaints/${id}/status`, { status, reason });
  },

  reopen: async (id: string, reason: string): Promise<ApiResponse<Complaint>> => {
    return api.post(`/complaints/${id}/reopen`, { reason });
  },

  reviewAI: async (
    id: string,
    data: {
      category: Category;
      priority: Priority;
      departmentId: string;
      assignedTechnicianId?: string;
      reviewReason?: string;
    }
  ): Promise<ApiResponse<Complaint>> => {
    return api.post(`/complaints/${id}/review-ai`, data);
  },

  addComment: async (id: string, comment: string, isInternal: boolean = false): Promise<ApiResponse<any>> => {
    return api.post(`/complaints/${id}/comments`, { comment, isInternal });
  }
};
