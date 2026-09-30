import { Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class InventoryController {
  public static async createItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await InventoryService.createItem(req.body);
      return sendSuccess(res, item, 'Inventory item created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getItems(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await InventoryService.getItems();
      return sendSuccess(res, items, 'Inventory items fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const item = await InventoryService.addStock(req.params.id, amount);
      return sendSuccess(res, item, 'Stock added successfully');
    } catch (error) {
      next(error);
    }
  }
}
