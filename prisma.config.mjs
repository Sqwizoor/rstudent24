// Prisma config (ESM) — Vercel-friendly
import 'dotenv/config';

export default {
  datasource: {
    url: process.env.DATABASE_URL || ''
  }
};
