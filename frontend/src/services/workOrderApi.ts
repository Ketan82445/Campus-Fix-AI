import { api } from './api';
import { WorkOrder, WorkOrderMetrics, Attachment } from '../types';

export const workOrderApi = {
  // Create a new work order from a complaint (Admin only)
  create: (data: {
    complaintId: string;
    technicianId: string;
    description: string;
    scheduledAt?: Date | string;
    estimatedHours?: number;
    priority?: string;
  }) => api.post<{ success: boolean; data: WorkOrder }>('/work-orders', data),

  // Get all work orders
  getAll: (params?: any) => api.get<{ success: boolean; data: { items: WorkOrder[]; pagination: any } }>('/work-orders', { params }),

  // Get metrics for dashboards
  getMetrics: () => api.get<{ success: boolean; data: WorkOrderMetrics }>('/work-orders/metrics'),

  // Get a single work order
  getById: (id: string) => api.get<{ success: boolean; data: WorkOrder }>(`/work-orders/${id}`),

  // Update general work order details
  update: (id: string, data: Partial<WorkOrder>) => api.patch<{ success: boolean; data: WorkOrder }>(`/work-orders/${id}`, data),

  // Update work order status
  updateStatus: (id: string, status: string, notes?: string) => 
    api.patch<{ success: boolean; data: WorkOrder }>(`/work-orders/${id}/status`, { status, notes }),

  // Add an attachment (using our new Supabase Storage!)
  addAttachment: (id: string, fileData: { fileName: string; fileData: string; mimeType: string; category?: string }) => 
    api.post<{ success: boolean; data: Attachment }>(`/work-orders/${id}/attachments`, fileData),

  // Add parts used to a work order
  addPart: (id: string, part: { partId?: string; name: string; quantity: number; cost?: number }) => 
    api.post<{ success: boolean; data: any }>(`/work-orders/${id}/parts`, part),

  // Update safety/inspection checklist
  updateChecklist: (id: string, checklist: Record<string, boolean>) => 
    api.patch<{ success: boolean; data: any }>(`/work-orders/${id}/checklist`, { checklist })
};
