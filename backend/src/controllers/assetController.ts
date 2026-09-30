import { Response, NextFunction } from 'express';
import { AssetService } from '../services/assetService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AssetController {
  public static async createAsset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const asset = await AssetService.createAsset(req.body);
      return sendSuccess(res, asset, 'Asset created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAssets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = {};
      if (req.query.status) (filters as any).status = req.query.status;
      if (req.query.departmentId) (filters as any).departmentId = req.query.departmentId;
      if (req.query.type) (filters as any).type = req.query.type;

      const assets = await AssetService.getAssets(filters);
      return sendSuccess(res, assets, 'Assets fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getAssetById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const asset = await AssetService.getAssetById(req.params.id);
      return sendSuccess(res, asset, 'Asset fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getAssetByQrCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const asset = await AssetService.getAssetByQrCode(req.params.qrCode);
      return sendSuccess(res, asset, 'Asset fetched by QR Code');
    } catch (error) {
      next(error);
    }
  }

  public static async createMaintenance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, assetId: req.params.id };
      const maintenance = await AssetService.createMaintenance(data);
      return sendSuccess(res, maintenance, 'Maintenance scheduled successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async completeMaintenance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { partsUsed, totalCost } = req.body;
      const maintenance = await AssetService.completeMaintenance(req.params.maintenanceId, partsUsed || [], totalCost || 0);
      return sendSuccess(res, maintenance, 'Maintenance completed successfully');
    } catch (error) {
      next(error);
    }
  }
}
