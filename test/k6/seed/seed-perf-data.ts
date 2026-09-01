// test/k6/seed/seed-perf-data.ts
import { PrismaClient, UserRole, UserStatus, TaskStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const jwtService = new JwtService({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
});

interface UserAuthData {
  id: string;
  email: string;
  token: string;
}

export async function seedPerformanceData(userCount = 210, docCount = 500, vectorTier: '2k' | '20k' = '2k') {
  console.log(`🌱 Starting benchmark data seed: ${userCount} users, ${docCount} docs, vector tier: ${vectorTier}...`);

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const usersData: UserAuthData[] = [];

  // 1. Seed 200+ Users with pre-generated JWT tokens
  console.log(`👤 Seeding ${userCount} active users...`);
  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  for (let i = 1; i <= userCount; i++) {
    const email = `perf_user_${i}@benchmark.test`;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          name: `Perf VU User ${i}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          isActive: true,
        },
      });
    }

    const token = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    usersData.push({ id: user.id, email: user.email, token });
  }

  // Export user tokens to JSON for k6 VUs
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, 'test-users.json'), JSON.stringify(usersData, null, 2));
  console.log(`✅ Saved ${usersData.length} user Bearer tokens to test-users.json`);

  // 2. Seed Categories
  console.log('🏷️ Seeding categories...');
  const firstUser = usersData[0];
  const categories = ['Machine Learning', 'Systems', 'Database Architecture', 'DevOps', 'Security'];
  const categoryIds: string[] = [];

  for (const catName of categories) {
    const existing = await prisma.category.findFirst({ where: { name: catName, authorId: firstUser.id } });
    if (existing) {
      categoryIds.push(existing.id);
    } else {
      const cat = await prisma.category.create({
        data: {
          name: catName,
          description: `Benchmark category for ${catName}`,
          isPublic: true,
          authorId: firstUser.id,
        },
      });
      categoryIds.push(cat.id);
    }
  }

  // 3. Seed Documents
  console.log(`📄 Seeding ${docCount} documents...`);
  const docIds: string[] = [];
  const tagsList = ['ai', 'performance', 'database', 'nest', 'redis', 'vector', 'benchmark'];

  for (let i = 1; i <= docCount; i++) {
    const owner = usersData[i % usersData.length];
    const isPublic = i % 2 === 0;

    const doc = await prisma.doc.create({
      data: {
        title: `Performance Benchmark Document #${i} - ${isPublic ? 'Public' : 'Private'}`,
        content: `This is benchmark document number ${i}. It contains research text on distributed systems, vector search indexing, pgvector cosine similarity, NestJS rate limiting, and BullMQ worker queues. Repeat text: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)}`,
        tags: [tagsList[i % tagsList.length], tagsList[(i + 2) % tagsList.length]],
        isPublic,
        authorId: owner.id,
      },
    });

    docIds.push(doc.id);

    // Link to category
    if (categoryIds.length > 0) {
      const catId = categoryIds[i % categoryIds.length];
      await prisma.categoryDoc.create({
        data: { categoryId: catId, docId: doc.id },
      }).catch(() => {}); // ignore duplicates
    }
  }

  // 4. Seed Notes & Tasks
  console.log('📝 Seeding notes & tasks...');
  for (let i = 1; i <= 500; i++) {
    const owner = usersData[i % usersData.length];
    const docId = docIds[i % docIds.length];

    await prisma.note.create({
      data: {
        content: `Benchmark note ${i} attached to document ${docId}`,
        authorId: owner.id,
        docId,
      },
    });

    await prisma.task.create({
      data: {
        title: `Benchmark task ${i} for performance validation`,
        description: `Verify system stability under concurrent operations for task ${i}`,
        status: i % 3 === 0 ? TaskStatus.DONE : i % 3 === 1 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
        priority: i % 4 === 0 ? Priority.HIGH : Priority.MEDIUM,
        ownerId: owner.id,
      },
    });
  }

  // 5. Seed Vector Embeddings (Tier 1 = 2,000, Tier 2 = 20,000)
  const targetVectorCount = vectorTier === '20k' ? 20000 : 2000;
  console.log(`🧮 Seeding ${targetVectorCount} pgvector 1536-dim embeddings (${vectorTier} tier)...`);

  const existingVectorCount = await prisma.embedding.count();
  if (existingVectorCount < targetVectorCount) {
    const needed = targetVectorCount - existingVectorCount;
    const batchSize = 100;

    for (let b = 0; b < needed; b += batchSize) {
      const currentBatchSize = Math.min(batchSize, needed - b);
      const valuesSql: string[] = [];

      for (let j = 0; j < currentBatchSize; j++) {
        const idx = (b + j);
        const docId = docIds[idx % docIds.length];
        const vectorArray = new Array(1536).fill(0).map(() => (Math.random() - 0.5).toFixed(4));
        const vectorStr = `[${vectorArray.join(',')}]`;
        const content = `Vector chunk text sample ${idx} for document ${docId}`;

        valuesSql.push(`(gen_random_uuid(), '${docId}', '${content}', '${vectorStr}'::vector, ${idx % 5}, NOW())`);
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO embeddings (id, "docId", content, vector, "chunkIndex", "createdAt")
        VALUES ${valuesSql.join(',')}
      `);
    }
  }

  const finalCounts = {
    users: await prisma.user.count(),
    docs: await prisma.doc.count(),
    notes: await prisma.note.count(),
    tasks: await prisma.task.count(),
    embeddings: await prisma.embedding.count(),
  };

  console.log('🎉 Seeding completed successfully!');
  console.table(finalCounts);

  fs.writeFileSync(path.join(dataDir, 'test-docs.json'), JSON.stringify(docIds, null, 2));

  await prisma.$disconnect();
  return finalCounts;
}

if (require.main === module) {
  seedPerformanceData(210, 500, '2k')
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}
