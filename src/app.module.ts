import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DocsModule } from './docs/docs.module';
import { NotesModule } from './notes/notes.module';
import { TasksModule } from './tasks/tasks.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal:true
      }),
      ThrottlerModule.forRoot([{
        ttl:600000,  // 10 minutes
        limit:10,    // 10 requests
      }]),
     AuthModule,
     PrismaModule,
     UsersModule,
     DocsModule,
     NotesModule,
     TasksModule,
     AiModule
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
