import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserStatus } from '../../src/common/enums/user-status.enum';
import { EmbeddingService } from '../../src/ai/embedding.service';
import { v4 as uuidv4 } from 'uuid';

export class TestDataSeeder {
  constructor(
    private readonly app: INestApplication,
    private readonly prisma: PrismaService,
    private readonly embeddingService?: EmbeddingService,
  ) {}

  async createUser(email: string, name: string): Promise<{ userId: string; authToken: string }> {
    const password = 'Password123!';

    // Register user via API to test the actual signup endpoint flow
    const regRes = await request(this.app.getHttpServer())
      .post('/api/v1/users/auth/register')
      .send({ email, password, name })
      .expect(201);

    const userId = regRes.body.userId;

    // Manually activate the user in the database to bypass OTP email verification
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE, isActive: true },
    });

    // Login via API to get the auth token
    const loginRes = await request(this.app.getHttpServer())
      .post('/api/v1/users/auth/login')
      .send({ email, password })
      .expect(200);

    const authToken = loginRes.body.accessToken;
    return { userId, authToken };
  }

  async createDocument(userId: string, title: string, content: string, tags: string[] = []): Promise<any> {
    return this.prisma.doc.create({
      data: {
        title,
        content,
        tags,
        authorId: userId,
        isPublic: false,
      },
    });
  }

  async seedDocumentEmbeddings(docId: string, chunks: string[]): Promise<void> {
    if (!this.embeddingService) {
      throw new Error('EmbeddingService must be provided to seed embeddings.');
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.embeddingService.generateEmbedding(chunk);
      const embeddingString = `[${embedding.join(',')}]`;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO embeddings (id, "docId", content, vector, "chunkIndex", "createdAt") ` +
        `VALUES ($1, $2, $3, $4::vector, $5, $6)`,
        uuidv4(),
        docId,
        chunk,
        embeddingString,
        i,
        new Date()
      );
    }
  }
}
