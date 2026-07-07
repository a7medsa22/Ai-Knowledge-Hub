import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestDataSeeder } from './setup/test-data.seeder';

describe('Categories System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let documentId: string;
  let categoryId: string;

  const testEmail = `cat-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    await clearDatabase();

    const seeder = new TestDataSeeder(app, prisma);
    const auth = await seeder.createUser(testEmail, 'Category E2E User');
    userId = auth.userId;
    authToken = auth.authToken;
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  describe('Docs & Categories Integration Flow', () => {
    it('should create a document', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/docs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'College Lecture Note',
          content: 'This document contains physics lecture notes from college.',
          isPublic: false,
        })
        .expect(201);

      expect(res.body.document).toBeDefined();
      documentId = res.body.document.id;
    });

    it('should create a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'College',
          description: 'Physics and Mathematics lecture materials',
          color: '#4F46E5',
          icon: 'academic-cap',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      categoryId = res.body.id;
    });

    it('should add document to category', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/categories/${categoryId}/docs/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('should retrieve category with docs list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.name).toBe('College');
      expect(res.body.docs).toBeDefined();
      expect(res.body.docs.length).toBeGreaterThan(0);
      expect(res.body.docs[0].docId).toBe(documentId);
    });

    it('should list documents inside category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}/docs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(documentId);
    });

    it('should unlink document from category', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}/docs/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should delete category', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
