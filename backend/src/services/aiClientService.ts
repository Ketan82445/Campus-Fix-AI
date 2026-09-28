import axios from 'axios';
import { env } from '../config/env';
import { Category, Priority } from '@prisma/client';

export interface AIPredictionResult {
  category: Category;
  priority: Priority;
  department: string;
  confidence: number;
  modelVersion: string;
  indicators: string[];
  success: boolean;
  error?: string;
}

export class AIClientService {
  private static client = axios.create({
    baseURL: env.AI_SERVICE_URL,
    timeout: 4000 // 4 seconds timeout for fast fallback
  });

  public static async predictComplaint(title: string, description: string, location: string): Promise<AIPredictionResult> {
    try {
      const response = await this.client.post('/predict', {
        title,
        description,
        location
      });

      if (response.data && response.data.confidence !== undefined) {
        return {
          category: response.data.category as Category,
          priority: response.data.priority as Priority,
          department: response.data.department,
          confidence: Number(response.data.confidence),
          modelVersion: response.data.modelVersion || 'campusfix-v1',
          indicators: response.data.indicators || [],
          success: true
        };
      }

      throw new Error('Malformed AI response');
    } catch (error: any) {
      console.warn('⚠️ AI Service prediction failed or unavailable:', error.message);
      return {
        category: Category.OTHER,
        priority: Priority.MEDIUM,
        department: 'Infrastructure & Facilities',
        confidence: 0,
        modelVersion: 'fallback-v0',
        indicators: ['Fallback: AI Service Unavailable'],
        success: false,
        error: error.message
      };
    }
  }

  public static async getHealth(): Promise<{ status: string; model_loaded: boolean }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch {
      return { status: 'down', model_loaded: false };
    }
  }
}
