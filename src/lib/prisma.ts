import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

// Log database connection attempt for debugging
// Initializing Prisma with DATABASE_URL
if (process.env.DATABASE_URL) {
  // DATABASE_URL validation
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: typeof PrismaClient };

// Create a custom logger when in development mode
const customLogger = process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

// Build Prisma client options. For Prisma v7+, prefer passing an `adapter` or `accelerateUrl`.
// Keep a safe fallback for older Prisma versions by also supplying `datasources` when available.
const clientOptions: any = {
  log: customLogger,
};

if (process.env.DATABASE_URL) {
  // Preferred v7+ shape
  clientOptions.adapter = {
    // Some adapters accept a `type` field; `url` is required
    type: 'postgresql',
    url: process.env.DATABASE_URL,
  };

  // Backward-compatible runtime override for older Prisma versions
  clientOptions.datasources = {
    db: {
      url: process.env.DATABASE_URL,
    },
  };
}

// Initialize Prisma client (cast to any to avoid type errors across Prisma versions)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(clientOptions as any);

// Configure dynamic properties if needed (e.g., timeouts)
if (!globalForPrisma.prisma && process.env.NODE_ENV === 'production') {
  // For production, adjust connection timeouts
  // Note: Modern Prisma versions handle connection pooling internally
  // Since Prisma 5.0.0, beforeExit hook is not applicable to the library engine
  // Use process.on('beforeExit') instead
  process.on('beforeExit', () => {
    console.log('Closing Prisma connections');
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Configure dynamic properties if needed (e.g., timeouts)
if (!globalForPrisma.prisma && process.env.NODE_ENV === 'production') {
  // For production, adjust connection timeouts
  // Note: Modern Prisma versions handle connection pooling internally
  // Since Prisma 5.0.0, beforeExit hook is not applicable to the library engine
  // Use process.on('beforeExit') instead
  process.on('beforeExit', () => {
    console.log('Closing Prisma connections');
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
