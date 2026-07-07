import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { TestDataSeeder } from './setup/test-data.seeder';
import { EmbeddingService } from '../src/ai/embedding.service';
import { SummaryLength } from '../src/ai/dto/ai.dto';

describe('AI Research System (e2e)', () => {
  // Real LLM calls can take some time, especially through OpenRouter
  jest.setTimeout(60000);

  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let testDocId: string;
  let ragDocId: string;

  const testEmail = `ai-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Initialize the test app and clear any legacy data
    const setup = await createTestApp();
    app = setup.app;

    await clearDatabase();

    const embeddingService = app.get(EmbeddingService);
    const seeder = new TestDataSeeder(app, setup.prisma, embeddingService);

    // 1. Create a real user and authenticate
    const auth = await seeder.createUser(testEmail, 'AI E2E User');
    userId = auth.userId;
    authToken = auth.authToken;

    // 2. Seed a document for semantic search
    const searchDoc = await seeder.createDocument(
      userId,
      'Semantic Search Basics',
      'Semantic search matches user queries based on conceptual meaning rather than exact keyword matches.',
      ['ai', 'search']
    );
    testDocId = searchDoc.id;

    // Generate embeddings for the search document to enable pgvector search
    await seeder.seedDocumentEmbeddings(testDocId, [
      'Semantic search matches user queries based on conceptual meaning rather than exact keyword matches.'
    ]);

    // 3. Seed a document for RAG Q&A
    const ragDoc = await seeder.createDocument(
      userId,
      'Understanding RAG Architecture',
      'RAG stands for Retrieval-Augmented Generation, a technique that enhances LLM responses with external context.',
      ['ai', 'rag']
    );
    ragDocId = ragDoc.id;

    // Generate embeddings for the RAG document
    await seeder.seedDocumentEmbeddings(ragDocId, [
      'RAG stands for Retrieval-Augmented Generation, a technique that enhances LLM responses with external context.'
    ]);
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should get AI service status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ai/status')
      .expect(200);

    expect(res.body.available).toBe(true);
    expect(res.body.currentProvider).toBeDefined();
    expect(res.body.providers).toBeInstanceOf(Array);
  });

  it('should summarize text', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/summarize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        text: 'Artificial intelligence is simulation of human intelligence by machines, especially computer systems. Specific applications of AI include expert systems, natural language processing, speech recognition and machine vision. AI applications are deeply integrated in search, gaming, and business decision making systems today.',
        length: SummaryLength.SHORT,
      })
      .expect(200);

    expect(res.body.result).toBe('success');
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.length).toBeGreaterThan(10);
    expect(res.body.provider).toBeDefined();
    expect(res.body.model).toBeDefined();
  });

  it('should answer legacy question with context', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        question: 'What is AI?',
        context: 'AI stands for Artificial Intelligence.',
      })
      .expect(200);

    expect(res.body.result).toBe('success');
    expect(res.body.answer).toBeDefined();
    expect(res.body.answer.toLowerCase()).toContain('artificial intelligence');
  });

  it('should perform real semantic search', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: 'conceptual meaning matching',
      })
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].docId).toBe(testDocId);
    expect(res.body[0].similarity).toBeGreaterThan(0.5);
  });

  it('should ask question using RAG', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        question: 'What does RAG stands for?',
      })
      .expect(200);

    expect(res.body.answer).toBeDefined();
    expect(res.body.answer.toLowerCase()).toContain('retrieval');
    expect(res.body.contextUsed).toContain(ragDocId);
  });

  it('should extract key points', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/extract-key-points')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        text: 'The solar system consists of the Sun and the objects that orbit it. These include the eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. It also includes dwarf planets, asteroids, and comets.',
        count: 2,
      })
      .expect(200);

    expect(res.body.keyPoints).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.provider).toBeDefined();
  });

  it('should bulk summarize multiple documents', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/bulk-summarize')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        docIds: [testDocId, ragDocId],
        length: SummaryLength.MEDIUM,
      })
      .expect(200);

    expect(res.body.results).toBeInstanceOf(Array);
    expect(res.body.total).toBe(2);
    expect(res.body.successful).toBe(2);
    expect(res.body.results[0].summary).toBeDefined();
    expect(res.body.results[1].summary).toBeDefined();
  });
});
