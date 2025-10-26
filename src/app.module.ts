import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DocsModule } from './docs/docs.module';
import { NotesModule } from './notes/notes.module';
import { TasksModule } from './tasks/tasks.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';
import { GraphQLModule } from '@nestjs/graphql';
import{ ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
@Module({
  imports: [
       GraphQLModule.forRoot<ApolloDriverConfig>({
        driver:ApolloDriver,
        autoSchemaFile:true,
        playground:true,
       })
      ,ConfigModule.forRoot({
        isGlobal:true,
        envFilePath: '.env',
      expandVariables: true,
      }),
   
         // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.get('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
          limit: config.get('THROTTLE_LIMIT', 100),
        },
        {
          name: 'auth',
          ttl: 60 * 1000, // 1 minute
          limit: 5, // 5 requests per minute for auth endpoints
        },
        {
          name: 'upload',
          ttl: 60 * 60 * 1000, // 1 hour  
          limit: 10, // 10 file uploads per hour
        },
      ],
    }),
    
     AuthModule,
     PrismaModule,
     UsersModule,
     DocsModule,
     NotesModule,
     TasksModule,
     AiModule,
     McpModule
        ],
  providers: [
     {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide:APP_GUARD,
      useClass:ThrottlerGuard,
    },
    
  ],
})
export class AppModule {}
