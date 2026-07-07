import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { TestDataSeeder } from './setup/test-data.seeder';

describe('MCP System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let authToken: string;
  let userId: string;

  const testEmail = `mcp-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;

    await clearDatabase();

    const seeder = new TestDataSeeder(app, setup.prisma);

    // Create user and login
    const auth = await seeder.createUser(testEmail, 'MCP E2E User');
    userId = auth.userId;
    authToken = auth.authToken;

    // Seed one document for the tests
    await seeder.createDocument(userId, 'Test MCP Doc', 'This is content to search via MCP tools.');
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should list available MCP tools', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/mcp/tools')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.tools).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThan(0);
    // Verify that standard tools exist
    const toolNames = res.body.tools.map((t: any) => t.name);
    expect(toolNames).toContain('searchDocs');
    expect(toolNames).toContain('addNote');
    expect(toolNames).toContain('createTask');
  });

  it('should execute searchDocs MCP tool successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/mcp/execute')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toolName: 'searchDocs',
        parameters: { query: 'Test MCP' },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.toolName).toBe('searchDocs');
    expect(res.body.result).toBeDefined();
    expect(res.body.result.data).toBeInstanceOf(Array);
    expect(res.body.result.data.length).toBeGreaterThan(0);
    expect(res.body.result.data[0].title).toBe('Test MCP Doc');
  });

  it('should execute addNote MCP tool successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/mcp/execute')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toolName: 'addNote',
        parameters: { content: 'My first MCP note' },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.toolName).toBe('addNote');
    expect(res.body.result.content).toBe('My first MCP note');
  });

  it('should execute batch MCP tools', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/mcp/execute-batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send([
        {
          toolName: 'searchDocs',
          parameters: { query: 'Test MCP' },
        },
        {
          toolName: 'addNote',
          parameters: { content: 'Batch note' },
        }
      ])
      .expect(200);

    expect(res.body.results).toBeInstanceOf(Array);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.successCount).toBe(2);
    expect(res.body.results[0].toolName).toBe('searchDocs');
    expect(res.body.results[1].toolName).toBe('addNote');
  });

  it('should check health of MCP service', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/mcp/health')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.status).toBe('healthy');
  });
});
