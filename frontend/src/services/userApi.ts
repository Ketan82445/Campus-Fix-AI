import { api } from './api';
import { ApiResponse, User } from '../types';

export const userApi = {
  getUsers: async (role?: string, departmentId?: string): Promise<ApiResponse<User[]>> => {
    return api.get('/users', { params: { role, departmentId } });
  },

  getTechnicians: async (departmentId?: string): Promise<ApiResponse<any[]>> => {
    return api.get('/users/technicians', { params: { departmentId } });
  }
};
