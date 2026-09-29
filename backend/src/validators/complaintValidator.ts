import { z } from 'zod';
import { Category, Priority, Status } from '@prisma/client';

export const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location must be specified'),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  language: z.enum(['en', 'hi', 'mr']).default('en').optional(),
  category: z.nativeEnum(Category).optional(),
  priority: z.nativeEnum(Priority).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().max(5242880, 'File size must be under 5MB'),
        mimeType: z.string()
      })
    )
    .optional()
});

export const uploadAttachmentSchema = z.object({
  fileName: z.string().min(1, 'Filename required'),
  fileData: z.string().min(1, 'Base64 file data required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
    errorMap: () => ({ message: 'Only JPG, PNG, WEBP and PDF files are permitted' })
  })
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

export const checkSimilarSchema = z.object({
  title: z.string().min(2, 'Title required for similarity search'),
  description: z.string().optional(),
  location: z.string().optional().default(''),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  category: z.nativeEnum(Category).optional()
});

export const markDuplicateSchema = z.object({
  originalComplaintId: z.string().min(1, 'Original complaint ID is required'),
  reason: z.string().optional()
});

