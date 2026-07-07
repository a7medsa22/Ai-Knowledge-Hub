import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestDataSeeder } from './setup/test-data.seeder';

describe('Notes System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let docId: string;
  let noteId: string;

  const testEmail = `notes-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    await clearDatabase();

    const seeder = new TestDataSeeder(app, prisma);
    const auth = await seeder.createUser(testEmail, 'Notes E2E User');
    userId = auth.userId;
    authToken = auth.authToken;

    // Create a doc to attach notes to
    const doc = await seeder.createDocument(userId, 'Notes Reference Document', 'Content of notes reference document.');
    docId = doc.id;
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should create a note attached to the document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'This is a note content',
        docId: docId,
      })
      .expect(201);

    expect(res.body.content).toBe('This is a note content');
    expect(res.body.docId).toBe(docId);
    noteId = res.body.id;
  });

  it('should retrieve notes (all notes of user)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(noteId);
  });

  it('should retrieve notes associated with the document', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/notes/document/${docId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(noteId);
  });

  it('should get notes stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notes/status')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.totalNotes).toBe(1);
    expect(res.body.notesWithDocs).toBe(1);
    expect(res.body.standaloneNotes).toBe(0);
  });

  it('should update the note content', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Updated note content',
      })
      .expect(200);

    expect(res.body.content).toBe('Updated note content');
  });

  it('should delete the note', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
