import { prisma } from '../config/prisma';
import { AppError } from '../types';

export class AssetService {
  public static async createAsset(data: any) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: data.assetCode,
        qrCode: data.qrCode || data.assetCode,
        name: data.name,
        type: data.type,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        location: data.location,
        building: data.building,
        floor: data.floor,
        room: data.room,
        departmentId: data.departmentId,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpires: data.warrantyExpires ? new Date(data.warrantyExpires) : null,
        cost: data.cost,
        status: data.status || 'ACTIVE'
      }
    });
    return asset;
  }

  public static async getAssets(filters: any) {
    const assets = await prisma.asset.findMany({
      where: filters,
      include: {
        department: true,
        _count: { select: { complaints: true, maintenances: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return assets;
  }

  public static async getAssetById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        department: true,
        maintenances: {
          include: { technician: true, partsUsed: { include: { inventoryItem: true } } },
          orderBy: { scheduledDate: 'desc' }
        },
        complaints: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!asset) throw new AppError('Asset not found', 404, 'NOT_FOUND');
    return asset;
  }

  public static async getAssetByQrCode(qrCode: string) {
    const asset = await prisma.asset.findUnique({
      where: { qrCode },
      include: { department: true }
    });
    if (!asset) throw new AppError('Asset not found via QR Code', 404, 'NOT_FOUND');
    return asset;
  }

  public static async createMaintenance(data: any) {
    const maintenance = await prisma.assetMaintenance.create({
      data: {
        assetId: data.assetId,
        title: data.title,
        description: data.description,
        type: data.type, // PREVENTIVE, CORRECTIVE, EMERGENCY
        status: data.status || 'SCHEDULED',
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        technicianId: data.technicianId,
      }
    });

    if (data.status === 'IN_PROGRESS' || data.status === 'COMPLETED') {
      await prisma.asset.update({
        where: { id: data.assetId },
        data: { status: 'MAINTENANCE' }
      });
    }

    return maintenance;
  }

  public static async completeMaintenance(id: string, partsUsed: Array<{ inventoryItemId: string, quantity: number }>, totalCost: number) {
    const maintenance = await prisma.assetMaintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        cost: totalCost
      }
    });

    // Update parts inventory
    for (const part of partsUsed) {
      const inventory = await prisma.inventoryItem.update({
        where: { id: part.inventoryItemId },
        data: { quantity: { decrement: part.quantity } }
      });
      await prisma.maintenancePart.create({
        data: {
          maintenanceId: id,
          inventoryItemId: part.inventoryItemId,
          quantity: part.quantity,
          costAtUse: inventory.cost
        }
      });
    }

    await prisma.asset.update({
      where: { id: maintenance.assetId },
      data: { status: 'ACTIVE' }
    });

    return maintenance;
  }
}
