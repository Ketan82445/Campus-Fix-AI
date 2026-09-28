import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest, AppError } from '../types';

export class DepartmentController {
  public static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { users: true, complaints: true } }
        }
      });
      return sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, code, description } = req.body;
      if (!name || !code) throw new AppError('Department name and code are required', 400);

      const dept = await prisma.department.create({
        data: { name, code, description }
      });
      return sendSuccess(res, dept, 'Department created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
