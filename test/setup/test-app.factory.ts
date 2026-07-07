import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';
import { EmailService } from '../../src/infrastructure/email/email.service';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { assertTestEnvironment } from './env-guard';

export const mockEmailService = {
  sendEmailVerificationOtp: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined),
};

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  redis: RedisService;
}> {
  assertTestEnvironment();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(mockEmailService)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  return { app, prisma, redis };
}
