import { api } from './api';
import { ApiResponse, Complaint, PaginatedResponse, Status, Category, Priority, SimilarComplaint } from '../types';

export const complaintApi = {
  create: async (data: {
    title: string;
    description: string;
    location: string;
    building?: string;
    floor?: string;
    room?: string;
    language?: string;
    category?: Category;
    priority?: Priority;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }>;
  }): Promise<ApiResponse<Complaint>> => {
    return api.post('/complaints', data);
  },

  uploadAttachment: async (data: {
    fileName: string;
    fileData: string;
    mimeType: string;
  }): Promise<ApiResponse<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>> => {
    return api.post('/complaints/upload', data);
  },

  deleteAttachment: async (complaintId: string, attachmentId: string): Promise<ApiResponse<any>> => {
    return api.delete(`/complaints/${complaintId}/attachments/${attachmentId}`);
  },

  checkSimilar: async (data: {
    title: string;
    description?: string;
    location?: string;
    building?: string;
    floor?: string;
    room?: string;
    category?: Category;
  }): Promise<ApiResponse<SimilarComplaint[]>> => {
    return api.post('/complaints/check-similar', data);
  },

  toggleUpvote: async (
    complaintId: string
  ): Promise<ApiResponse<{ upvoted: boolean; upvoteCount: number; message: string }>> => {
    return api.post(`/complaints/${complaintId}/upvote`);
  },

  markDuplicate: async (
    complaintId: string,
    data: { originalComplaintId: string; reason?: string }
  ): Promise<ApiResponse<Complaint>> => {
    return api.post(`/complaints/${complaintId}/mark-duplicate`, data);
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

