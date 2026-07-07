import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase, getPrismaClient } from './setup/test-database';
import { RedisService } from '../src/infrastructure/cache/redis.service';
import { EmbeddingService } from '../src/ai/embedding.service';
import { AiProviderFactory } from '../src/ai/providers/ai-provider.factory';

describe('Production Readiness Checklist (Go/No-Go)', () => {
  // Production connectivity checks can take a moment
  jest.setTimeout(30000);

  let app: INestApplication;
  let redis: RedisService;
  let embeddingService: EmbeddingService;
  let aiProviderFactory: AiProviderFactory;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    redis = setup.redis;
    embeddingService = app.get(EmbeddingService);
    aiProviderFactory = app.get(AiProviderFactory);

    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('1. Database connectivity should be healthy', async () => {
    const prisma = getPrismaClient();
    const result = await prisma.$queryRaw`SELECT 1 as healthy`;
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('healthy', 1);
  });

  it('2. pgvector extension should be loaded in Postgres database', async () => {
    const prisma = getPrismaClient();
    const extensions: any[] = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `;
    expect(extensions.length).toBeGreaterThan(0);
    expect(extensions[0].extname).toBe('vector');
  });

  it('3. Redis connection should be reachable and responsive', async () => {
    const client = redis.getClient();
    const ping = await client.ping();
    expect(ping).toBe('PONG');
  });

  it('4. Configured AI provider should be online and available', async () => {
    const provider = await aiProviderFactory.getProvider();
    const available = await provider.isAvailable();
    expect(available).toBe(true);
    expect(provider.getName()).toBeDefined();
  });

  it('5. Embedding generation pipeline should output 1536-dimensional vectors', async () => {
    const sampleText = 'Production readiness verification text';
    const embedding = await embeddingService.generateEmbedding(sampleText);
    expect(embedding).toBeInstanceOf(Array);
    expect(embedding.length).toBe(1536);
    expect(typeof embedding[0]).toBe('number');
  });

  it('6. Security headers (Helmet) should be present on responses', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/ai/status');
    // Helmet sets X-Content-Type-Options: nosniff and other headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('7. Rate limiting (Throttler) should reject brute-force requests', async () => {
    const endpoint = '/api/v1/users/auth/login';
    const payload = { email: 'invalid@example.com', password: 'badPassword' };

    // The auth throttler limit is 5 requests per minute.
    // Making 6 rapid requests to test rate limiter.
    const requests = Array.from({ length: 6 }, () =>
      request(app.getHttpServer()).post(endpoint).send(payload)
    );

    const responses = await Promise.all(requests);
    const statusCodes = responses.map((r) => r.status);

    // At least one of the later requests should be rate limited (429)
    expect(statusCodes).toContain(429);
  });
});
