import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a custom logger when in development mode
const customLogger: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] 
  : ['error'];

// Initialize Prisma client
// In Prisma v7+, DATABASE_URL is read automatically from environment variables
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: customLogger,
  });

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
