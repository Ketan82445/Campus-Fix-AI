// Set default production environment variables before loading any application modules
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres.xtkieelrpqdpixjxnvxv:CampusFix2026%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    'postgresql://postgres.xtkieelrpqdpixjxnvxv:CampusFix2026%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = '4e760c3848b1d92d8c366cd9f7b0932bb82a7f5a287cf85d95392cfec035f299';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Load backend app after environment variables are guaranteed to exist
const app = require('../backend/src/app').default;

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel API Handler Error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: err?.message || 'Serverless function execution failure'
      }
    });
  }
}
