import { api } from './api';
import { ApiResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/auth/login', { email, password });
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/auth/register', data);
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return api.get('/auth/me');
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout');
  }
};
