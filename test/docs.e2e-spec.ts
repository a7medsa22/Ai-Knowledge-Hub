import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestDataSeeder } from './setup/test-data.seeder';

describe('Docs System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let docId: string;

  const testEmail = `docs-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    await clearDatabase();

    const seeder = new TestDataSeeder(app, prisma);
    const auth = await seeder.createUser(testEmail, 'Docs E2E User');
    userId = auth.userId;
    authToken = auth.authToken;
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should create a document successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/docs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Introduction to AI Research',
        content: 'AI research involves semantic search and embeddings...',
        tags: ['ai', 'research'],
        isPublic: false,
      })
      .expect(201);

    expect(res.body.document).toBeDefined();
    expect(res.body.document.title).toBe('Introduction to AI Research');
    docId = res.body.document.id;
  });

  it('should retrieve user documents (my-docs)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/docs/my-docs')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(docId);
  });

  it('should retrieve a single document details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.title).toBe('Introduction to AI Research');
  });

  it('should update the document details', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated AI Research Intro',
      })
      .expect(200);

    expect(res.body.title).toBe('Updated AI Research Intro');
  });

  it('should list all available tags', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/docs/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toContain('ai');
    expect(res.body).toContain('research');
  });

  it('should get document statistics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/docs/status')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.totalDocs).toBe(1);
    expect(res.body.totalTags).toBe(2);
  });

  it('should delete the document', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
