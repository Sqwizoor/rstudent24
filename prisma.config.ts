// Use CommonJS export so Prisma can read the config without requiring TypeScript compilation
// This avoids parse errors on build servers that do not transpile TypeScript files.
require('dotenv').config();

module.exports = {
  migrate: {
    url: process.env.DATABASE_URL || ''
  }
};

