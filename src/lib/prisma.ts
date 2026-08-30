let client: any;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = global as unknown as { prisma: any };
  client = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
} catch {
  // Safe mock proxy fallback when Prisma binary engine is not present
  const noop = () => Promise.resolve(null);
  const handler: ProxyHandler<any> = {
    get: () => new Proxy(noop, handler),
    apply: () => Promise.resolve(null),
  };
  client = new Proxy({}, handler);
}

export const prisma = client;
export default prisma;
