// server/src/config/db.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL Database via Prisma.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
