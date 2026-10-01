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

  /**
   * Upload a base64 string directly to Supabase Storage
   * @param base64Data Raw base64 string (can include `data:image/png;base64,` prefix)
   * @param fileName The desired file name
   * @param mimeType The file MIME type (e.g., image/jpeg)
   * @returns Public URL of the uploaded file
   */
  public static async uploadBase64(base64Data: string, fileName: string, mimeType: string): Promise<string> {
    const supabase = this.getClient();

    // 1. Strip the data URL prefix if present
    const base64String = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;
      
    // 2. Convert base64 string to Buffer
    const buffer = Buffer.from(base64String, 'base64');

    // 3. Generate a unique path to prevent overwriting
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `attachments/${uniqueFileName}`;

    // 4. Upload to Supabase Storage Bucket
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
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
