import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required and must be provided via environment variables'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be securely generated and provided in environment'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be securely generated and provided in environment'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  FRONTEND_URL: z.string().default('https://campus-fix-ai-six.vercel.app'),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional()
}).refine(
  (data) => {
    // In production, enforce non-default secrets
    if (data.NODE_ENV === 'production') {
      if (data.JWT_SECRET === 'this_is_a_very_secure_jwt_secret_that_is_32_characters_long' || data.JWT_SECRET === 'campusfix_super_secret_jwt_key_2026') {
        return false;
      }
    }
    return true;
  },
  {
    message: 'JWT_SECRET must be configured with a secure production secret and cannot use the development default',
    path: ['JWT_SECRET']
  }
);

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = _env.data;
