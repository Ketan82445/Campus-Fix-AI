import { api } from './api';
import { ApiResponse, Notification } from '../types';

export const notificationApi = {
  getMyNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return api.get('/notifications');
  },

  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    return api.patch('/notifications/read-all');
  }
};
