import { api } from './api';
import { ApiResponse, Department } from '../types';

export const departmentApi = {
  getAll: async (): Promise<ApiResponse<Department[]>> => {
    return api.get('/departments');
  },

  create: async (data: { name: string; code: string; description?: string }): Promise<ApiResponse<Department>> => {
    return api.post('/departments', data);
  }
};
