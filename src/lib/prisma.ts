import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a custom logger when in development mode
const customLogger: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] 
  : ['error'];

// Initialize Prisma client with Driver Adapter
const connectionString = process.env.DATABASE_URL;

// Initialize the pool
const pool = new Pool({ connectionString });

// Initialize the adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
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
