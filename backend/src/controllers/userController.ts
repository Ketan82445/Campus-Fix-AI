import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest, AppError } from '../types';
import { Role } from '@prisma/client';

export class UserController {
  public static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role, departmentId } = req.query;
      const where: any = {};
      if (role) where.role = role as Role;
      if (departmentId) where.departmentId = departmentId as string;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          departmentId: true,
          department: { select: { id: true, name: true, code: true } },
          createdAt: true
        },
        orderBy: { name: 'asc' }
      });
      return sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  public static async getTechnicians(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;
      const where: any = { role: Role.TECHNICIAN };
      if (departmentId) where.departmentId = departmentId as string;

      const technicians = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          departmentId: true,
          department: { select: { id: true, name: true, code: true } },
          assignedComplaints: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
            select: { id: true }
          }
        }
      });

      const formatted = technicians.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        department: t.department,
        activeWorkloadCount: t.assignedComplaints.length
      }));

      return sendSuccess(res, formatted);
    } catch (error) {
      next(error);
    }
  }
}
