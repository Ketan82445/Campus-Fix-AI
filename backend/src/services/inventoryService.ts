import { prisma } from '../config/prisma';
import { AppError } from '../types';

export class InventoryService {
  public static async createItem(data: any) {
    const item = await prisma.inventoryItem.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        quantity: data.quantity || 0,
        minStockLevel: data.minStockLevel || 5,
        cost: data.cost,
        supplier: data.supplier,
        location: data.location
      }
    });
    return item;
  }

  public static async getItems() {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { quantity: 'asc' }
    });
    
    // Add low stock flag
    return items.map(item => ({
      ...item,
      isLowStock: item.quantity <= item.minStockLevel
    }));
  }

  public static async addStock(id: string, amount: number) {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: { increment: amount } }
    });
    return item;
  }
}
