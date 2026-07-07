import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestDataSeeder } from './setup/test-data.seeder';
import { Priority, TaskStatus } from '@prisma/client';

describe('Tasks System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let taskId: string;

  const testEmail = `tasks-integration-${Date.now()}@example.com`;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    await clearDatabase();

    const seeder = new TestDataSeeder(app, prisma);
    const auth = await seeder.createUser(testEmail, 'Tasks E2E User');
    userId = auth.userId;
    authToken = auth.authToken;
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should create a task successfully', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Complete E2E Setup',
        description: 'Ensure E2E integration tests are fully running.',
        priority: Priority.HIGH,
        dueDate: tomorrow.toISOString(),
      })
      .expect(201);

    expect(res.body.title).toBe('Complete E2E Setup');
    expect(res.body.priority).toBe(Priority.HIGH);
    taskId = res.body.id;
  });

  it('should retrieve list of tasks', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(taskId);
  });

  it('should retrieve task statistics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tasks/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.totalTasks).toBe(1);
    expect(res.body.byStatus.todo).toBe(1);
  });

  it('should retrieve upcoming tasks', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tasks/upcoming?days=7')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].id).toBe(taskId);
  });

  it('should update task status quick endpoint', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: TaskStatus.IN_PROGRESS,
      })
      .expect(200);

    expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should update task details', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Highly Priority tasks',
        priority: Priority.URGENT,
      })
      .expect(200);

    expect(res.body.title).toBe('Highly Priority tasks');
    expect(res.body.priority).toBe(Priority.URGENT);
  });

  it('should retrieve a single task detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.title).toBe('Highly Priority tasks');
  });

  it('should delete the task', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
