import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { AppError } from '../types';

export class StorageService {
  private static client: SupabaseClient | null = null;
  private static bucketName = 'campusfix-assets';

  /**
   * Initialize Supabase Storage Client
   */
  private static getClient(): SupabaseClient {
    if (!this.client) {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
        throw new AppError(
          'Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.',
          500,
          'STORAGE_NOT_CONFIGURED'
        );
      }
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    }
    return this.client;
  }

  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  private static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  /**
   * Upload a base64 string directly to Supabase Storage
   * @param base64Data Raw base64 string (can include `data:image/png;base64,` prefix)
   * @param fileName The desired file name
   * @param mimeType The file MIME type (e.g., image/jpeg)
   * @returns Public URL of the uploaded file
   */
  public static async uploadBase64(base64Data: string, fileName: string, mimeType: string): Promise<string> {
    const supabase = this.getClient();

    // 1. Strict MIME type validation
    const normalizedMime = mimeType?.toLowerCase()?.trim();
    if (!this.ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      throw new AppError(
        `Invalid file type: ${mimeType}. Only JPG, PNG, WEBP, and PDF files are allowed.`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // 2. Sanitize filename and validate extension
    const sanitizedBase = fileName
      .replace(/(\.\.[\/\\]|\0)/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(-100);

    const extMatch = sanitizedBase.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new AppError(
        `Invalid file extension "${ext}". Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
        400,
        'INVALID_FILE_EXTENSION'
      );
    }

    // 3. Strip data URL prefix and convert base64 string to Buffer
    const base64String = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;
      
    const buffer = Buffer.from(base64String, 'base64');

    // 4. File size validation
    if (buffer.length === 0) {
      throw new AppError('File content cannot be empty', 400, 'EMPTY_FILE');
    }

    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new AppError(
        `File size exceeds maximum allowed limit of 5MB (Received ${Math.round(buffer.length / 1024)}KB)`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // 5. Generate a unique, collision-resistant path
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const filePath = `attachments/${Date.now()}-${randomSuffix}-${sanitizedBase}`;

    // 6. Upload to Supabase Storage Bucket
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType: normalizedMime,
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      throw new AppError('Failed to upload file to storage bucket', 500, 'STORAGE_UPLOAD_FAILED');
    }

    // 5. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  /**
   * Delete a file from Supabase Storage
   */
  public static async deleteFile(fileUrl: string): Promise<void> {
    const supabase = this.getClient();

    // Extract the file path from the public URL
    const urlParts = fileUrl.split(`/${this.bucketName}/`);
    if (urlParts.length !== 2) return; // Not a valid Supabase URL for this bucket

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Storage Delete Error:', error);
      // We don't throw here to avoid blocking database deletion if storage fails
    }
  }
}
