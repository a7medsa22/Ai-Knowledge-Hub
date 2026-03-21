import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VersioningType,
  RequestMethod,
  Logger,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const nodeEnv =
    config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ------------------- Security (Helmet + CSP) -------------------
  const cspConnectSrc =
    config
      .get<string>('CSP_CONNECT_SRC')
      ?.split(',')
      .map((o) => o.trim()) ?? [];

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          connectSrc: ["'self'", ...cspConnectSrc],
          fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          objectSrc: ["'none'"],
          frameSrc: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  // ------------------- CORS -------------------
  const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '');

  const parseOrigins = (value?: string) =>
    value
      ?.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .map(normalizeOrigin) ?? [];

  const envAllowedOrigins = parseOrigins(config.get<string>('ALLOWED_ORIGINS'));
  const cspAllowedOrigins = parseOrigins(config.get<string>('CSP_CONNECT_SRC'));

  const configuredAppUrl = config.get<string>('APP_URL');

  const defaultAllowedOrigins = configuredAppUrl
    ? [normalizeOrigin(configuredAppUrl)]
    : [];

  const allowedOrigins = Array.from(
    new Set([
      ...defaultAllowedOrigins,
      ...envAllowedOrigins,
      ...cspAllowedOrigins,
    ]),
  );

  const isDevViteOrigin = (origin: string) =>
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

  app.enableCors({
    origin: (origin, callback) => {
      const normalized = origin ? normalizeOrigin(origin) : undefined;

      // allow swagger / postman / server-to-server
      if (!origin) return callback(null, true);

      if (
        (normalized && allowedOrigins.includes(normalized)) ||
        (!isProduction && isDevViteOrigin(origin))
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ------------------- Versioning -------------------
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ------------------- Global Prefix -------------------
  const apiPrefix = config.get('API_PREFIX', 'api');

  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
  });

  // ------------------- Global Filters & Interceptors -------------------
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ------------------- Swagger -------------------
  if (nodeEnv !== 'test') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Research')
      .setDescription(
        'API for AI-powered research and knowledge management platform',
      )
      .setVersion('1.0')
      .addTag('Authentication')
      .addTag('Users')
      .addTag('AI Research')
      .addTag('Documents')
      .addTag('Tasks')
      .addTag('Notes')
      .addTag('MCP (Model Context Protocol)')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token as: Bearer {token}',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // ------------------- Start Server -------------------
  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  // ------------------- Startup Logs (clean) -------------------
  logger.log(`🚀 Server started`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 Port: ${port}`);
  logger.log(`📚 Local-Docs: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`📚 Public-Docs: ${configuredAppUrl}/${apiPrefix}/docs`);
  logger.log(`🔗 GraphQL: /graphql`);
}

bootstrap();
