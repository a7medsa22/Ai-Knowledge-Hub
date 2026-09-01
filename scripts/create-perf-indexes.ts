import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('1. Creating HNSW index on pgvector column `vector` in table `embeddings`...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw 
    ON "embeddings" 
    USING hnsw (vector vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);
  `);
  console.log('✓ HNSW index created!');

  console.log('2. Creating composite index on docs...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_docs_public_updated 
    ON "docs" ("isPublic", "updatedAt" DESC);
  `);
  console.log('✓ Docs composite index created!');

  console.log('3. Creating foreign key index on notes...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notes_doc_id 
    ON "notes" ("docId");
  `);
  console.log('✓ Notes foreign key index created!');

  console.log('🎉 ALL PERFORMANCE OPTIMIZATION INDEXES APPLIED!');
  await prisma.$disconnect();
}

main().catch(console.error);
