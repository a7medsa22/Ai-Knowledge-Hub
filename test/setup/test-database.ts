import { PrismaClient } from '@prisma/client';
import { assertTestEnvironment } from './env-guard';

let prismaClient: PrismaClient;

export function getPrismaClient(): PrismaClient {
  assertTestEnvironment();
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prismaClient;
}

export async function clearDatabase(): Promise<void> {
  assertTestEnvironment();
  const prisma = getPrismaClient();

  const tablenames = [
    'auth_tokens',
    'category_docs',
    'categories',
    'embeddings',
    'files',
    'notes',
    'tasks',
    'docs',
    'users'
  ];

  try {
    for (const table of tablenames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
}
