import { prisma } from '../config/prisma';

export class NotificationService {
  public static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    entityId?: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        entityId
      }
    });
  }

  public static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  public static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }
}
