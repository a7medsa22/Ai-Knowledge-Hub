import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.factory';
import { clearDatabase, closeDatabase } from './setup/test-database';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/infrastructure/cache/redis.service';
import { UserStatus } from '../src/common/enums/user-status.enum';

describe('Auth System (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let userId: string;
  let authToken: string;
  let refreshToken: string;

  const testEmail = `auth-integration-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;
    redis = setup.redis;

    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
    await app.close();
  });

  it('should register a new user (pending verification)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Auth E2E User',
      })
      .expect(201);

    expect(res.body.userId).toBeDefined();
    userId = res.body.userId;

    const userInDb = await prisma.user.findUnique({ where: { id: userId } });
    expect(userInDb!.status).toBe(UserStatus.PENDING_EMAIL_VERIFICATION);
  });

  it('should verify the email with OTP from Redis', async () => {
    // Retrieve OTP from Redis
    const otp = await redis.get(`otp:${testEmail}`);
    expect(otp).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/v1/users/auth/verify-email')
      .send({
        email: testEmail,
        otp: otp,
      })
      .expect(200);

    const userInDb = await prisma.user.findUnique({ where: { id: userId } });
    expect(userInDb!.status).toBe(UserStatus.ACTIVE);
  });

  it('should login successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    authToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should retrieve profile data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.email).toBe(testEmail);
    expect(res.body.name).toBe('Auth E2E User');
  });

  it('should update profile data', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated E2E User',
      })
      .expect(200);

    expect(res.body.name).toBe('Updated E2E User');
  });

  it('should list active sessions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/auth/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
