let PrismaClient: any;
let prismaInstance: any;

try {
  // Try to import Prisma Client
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // Prisma client not generated - use mock for demo mode
  console.log('Prisma client not available - using demo mode');
}

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Only create Prisma client if it's available and we have a DATABASE_URL
if (PrismaClient && process.env.DATABASE_URL) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch (error) {
    console.log('Failed to initialize Prisma client:', error);
  }
}

// Export a proxy that will work in demo mode
export const prisma = prismaInstance || {} as any;
