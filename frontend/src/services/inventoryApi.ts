import { api } from './api';
import { ApiResponse } from '../types';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  minStockLevel: number;
  cost?: number;
  location?: string;
}

export const inventoryApi = {
  getAll: async (): Promise<ApiResponse<InventoryItem[]>> => {
    return api.get('/inventory');
  },
  
  create: async (data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    return api.post('/inventory', data);
  },

  addStock: async (id: string, quantity: number): Promise<ApiResponse<any>> => {
    return api.post(`/inventory/${id}/add-stock`, { quantity });
  }
};
