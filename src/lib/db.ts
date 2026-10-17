import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __albarkaPrisma: PrismaClient | undefined;
}

/** Single Prisma client per process (avoids exhausting connections during dev hot reloads). */
export const db: PrismaClient =
  globalThis.__albarkaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__albarkaPrisma = db;
}
