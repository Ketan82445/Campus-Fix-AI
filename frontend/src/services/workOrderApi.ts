import { api } from './api';
import { WorkOrder, WorkOrderMetrics, Attachment, ApiResponse, PaginatedResponse } from '../types';

export const workOrderApi = {
  // Create a new work order from a complaint (Admin only)
  create: async (data: {
    complaintId: string;
    technicianId: string;
    description: string;
    scheduledAt?: Date | string;
    estimatedHours?: number;
    priority?: string;
  }): Promise<ApiResponse<WorkOrder>> => {
    return api.post('/work-orders', data);
  },

  // Get all work orders
  getAll: async (params?: any): Promise<ApiResponse<{ workOrders: WorkOrder[]; pagination: any }>> => {
    return api.get('/work-orders', { params });
  },

  // Get metrics for dashboards
  getMetrics: async (): Promise<ApiResponse<WorkOrderMetrics>> => {
    return api.get('/work-orders/metrics');
  },

  // Get a single work order
  getById: async (id: string): Promise<ApiResponse<WorkOrder>> => {
    return api.get(`/work-orders/${id}`);
  },

  // Update general work order details
  update: async (id: string, data: Partial<WorkOrder>): Promise<ApiResponse<WorkOrder>> => {
    return api.patch(`/work-orders/${id}`, data);
  },

  // Update work order status
  updateStatus: async (id: string, status: string, notes?: string): Promise<ApiResponse<WorkOrder>> => {
    return api.patch(`/work-orders/${id}/status`, { status, notes });
  },

  // Add an attachment
  addAttachment: async (id: string, fileData: { fileName: string; fileData: string; mimeType: string; category?: string }): Promise<ApiResponse<Attachment>> => {
    return api.post(`/work-orders/${id}/attachments`, fileData);
  },

  // Add parts used to a work order
  addPart: async (id: string, part: { partId?: string; name: string; quantity: number; cost?: number }): Promise<ApiResponse<any>> => {
    return api.post(`/work-orders/${id}/parts`, part);
  },

  // Update safety/inspection checklist
  updateChecklist: async (id: string, checklist: Record<string, boolean>): Promise<ApiResponse<any>> => {
    return api.patch(`/work-orders/${id}/checklist`, { checklist });
  }
};
