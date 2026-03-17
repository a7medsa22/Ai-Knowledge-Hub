import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            whitelist: true,
            forbidNonWhitelisted: true,
            skipMissingProperties: false,
            skipNullProperties: false,
            skipUndefinedProperties: false,
        }),
    );

    // Secure the app by setting various HTTP headers
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
                    connectSrc: ["'self'"],
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

    // Enable CORS
    const allowedOrigins =
        process.env.NODE_ENV === 'production'
            ? config.get('ALLOWED_ORIGINS')?.split(',').map(o => o.trim())
            : ['http://localhost:8080', 'http://localhost:3000'];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // API versioning
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // global versioning
    const apiPrefix = config.get('API_PREFIX', 'api');
    app.setGlobalPrefix(apiPrefix, {
        exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
    });

    // Global Filters & Interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
    );

    // Swagger setup
    if (config.get('NODE_ENV') !== 'test') {
        const config = new DocumentBuilder()
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
                    description:
                        'JWT Authorization header using the bearer scheme. \n\nEnter JWT token as Bearer + {token}',
                    in: 'header',
                },
                'JWT-auth',
            )
            .build();
        const document = () => SwaggerModule.createDocument(app, config);
        SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
    }

    // Start Server
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    console.log(`
    Ai knowledge Hub Backend server is running...
🚀 Server running on: http://localhost:${port}  
📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs
🌌 GraphQL Playground: http://localhost:${port}/graphql
🔧 Environment: ${config.get('NODE_ENV', 'development')}
`);
}
bootstrap();
