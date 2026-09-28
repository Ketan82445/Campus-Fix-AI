import { z } from 'zod';
import { Category, Priority, Status } from '@prisma/client';

export const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location must be specified'),
  category: z.nativeEnum(Category).optional(),
  priority: z.nativeEnum(Priority).optional()
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(Status),
  reason: z.string().optional()
});

export const reopenComplaintSchema = z.object({
  reason: z.string().min(5, 'Reason for reopening must be at least 5 characters')
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid('Invalid technician ID'),
  notes: z.string().optional()
});

export const reviewAIPredictionSchema = z.object({
  category: z.nativeEnum(Category),
  priority: z.nativeEnum(Priority),
  departmentId: z.string().uuid('Invalid department ID'),
  assignedTechnicianId: z.string().uuid().optional(),
  reviewReason: z.string().optional()
});
