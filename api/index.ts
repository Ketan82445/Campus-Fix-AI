// Set default production environment variables before loading any application modules
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres.xtkieelrpqdpixjxnvxv:CampusFix2026%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'campusfix_super_secret_jwt_key_2026';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'campusfix_super_secret_refresh_key_2026';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Load backend app after environment variables are guaranteed to exist
const app = require('../backend/src/app').default;

export default function handler(req: any, res: any) {
  return app(req, res);
}
