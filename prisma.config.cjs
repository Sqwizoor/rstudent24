// Prisma config (CommonJS) — Vercel-friendly
require('dotenv').config();

module.exports = {
  migrate: {
    url: process.env.DATABASE_URL || ''
  }
};
