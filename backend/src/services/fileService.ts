import { prisma } from '../config/prisma';
import { AppError } from '../types';

export class FileService {
  /**
   * Enterprise-grade file validation before processing uploads.
   * Prevents malicious files or excessively large files.
   */
  public static validateFile(file: Express.Multer.File): void {
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const MAX_SIZE_MB = 5;
    
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(`Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, PDF`, 400);
    }
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new AppError(`File exceeds maximum size of ${MAX_SIZE_MB}MB`, 400);
    }
  }

  /**
   * Dummy function representing an S3/Cloud Storage upload
   * In a real deployment, this uploads the buffer to AWS S3 / Supabase Storage
   */
  public static async uploadToStorage(file: Express.Multer.File): Promise<string> {
    // TODO: Implement actual S3 or Supabase Bucket upload
    // For now, we simulate a returned URL
    return `https://storage.campusfix.internal/uploads/${Date.now()}-${file.originalname}`;
  }

  /**
   * Register the securely uploaded file in the database
   */
  public static async registerAttachment(
    file: Express.Multer.File, 
    uploaderId: string, 
    category: string = 'GENERAL',
    links?: { complaintId?: string, workOrderId?: string, assetId?: string }
  ) {
    this.validateFile(file);
    const fileUrl = await this.uploadToStorage(file);

    return await prisma.fileAttachment.create({
      data: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl,
        uploaderId,
        category,
        complaintId: links?.complaintId,
        workOrderId: links?.workOrderId,
        assetId: links?.assetId
      }
    });
  }
}
