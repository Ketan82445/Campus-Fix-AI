import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default(
    'postgresql://postgres.xtkieelrpqdpixjxnvxv:CampusFix2026%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require'
  ),
  JWT_SECRET: z.string().default('campusfix_super_secret_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('campusfix_super_secret_refresh_key_2026'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  FRONTEND_URL: z.string().default('https://campus-fix-ai-six.vercel.app'),
  GEMINI_API_KEY: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = _env.data;
