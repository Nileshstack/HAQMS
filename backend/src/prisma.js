const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client to avoid creating a new connection pool per route file.
// In production this prevents connection exhaustion under load.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;

