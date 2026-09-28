import { prisma } from '../config/prisma';
import { Category, Priority } from '@prisma/client';

export class RoutingService {
  /**
   * Deterministic category-to-department code mapping
   */
  private static categoryDeptMapping: Record<Category, string> = {
    [Category.IT_NETWORK]: 'IT_NETWORK',
    [Category.ELECTRICAL]: 'ELECTRICAL',
    [Category.PLUMBING]: 'PLUMBING',
    [Category.CLEANING]: 'CLEANING',
    [Category.CLASSROOM]: 'INFRASTRUCTURE',
    [Category.LABORATORY]: 'IT_NETWORK',
    [Category.LIBRARY]: 'INFRASTRUCTURE',
    [Category.HOSTEL]: 'PLUMBING',
    [Category.SECURITY]: 'SECURITY',
    [Category.TRANSPORT]: 'INFRASTRUCTURE',
    [Category.CANTEEN]: 'CLEANING',
    [Category.INFRASTRUCTURE]: 'INFRASTRUCTURE',
    [Category.OTHER]: 'INFRASTRUCTURE'
  };

  public static async resolveDepartment(category: Category, recommendedDeptCode?: string) {
    let deptCode = this.categoryDeptMapping[category] || 'INFRASTRUCTURE';
    
    // Attempt exact match first by code
    let department = await prisma.department.findUnique({
      where: { code: deptCode }
    });

    if (!department) {
      // Fallback to first available department
      department = await prisma.department.findFirst();
    }

    return department;
  }
}
