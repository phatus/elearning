import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../node_modules/.prisma/client';

if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  try {
    const tmpDir = '/tmp/prisma-engines';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const targetEnginePath = path.join(tmpDir, 'libquery_engine-elearning.so.node');
    const sourceEnginePath = path.join(process.cwd(), 'node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node');
    
    if (fs.existsSync(sourceEnginePath) && !fs.existsSync(targetEnginePath)) {
      fs.copyFileSync(sourceEnginePath, targetEnginePath);
      fs.chmodSync(targetEnginePath, 0o755);
    }
    if (fs.existsSync(targetEnginePath)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = targetEnginePath;
    }
  } catch (err) {
    console.error("Failed to copy Prisma query engine to /tmp:", err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
