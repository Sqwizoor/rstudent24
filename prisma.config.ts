/**
 * Prisma configuration for migrations (Prisma v7+):
 * Move connection URL for Migrate here instead of schema.prisma.
 *
 * Note: Keep this file minimal. Migration tooling will read `migrate.url`.
 */

import 'dotenv/config';

const config = {
  migrate: {
    url: process.env.DATABASE_URL || '',
  },
};

export default config;
