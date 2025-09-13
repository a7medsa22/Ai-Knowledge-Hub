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

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal:true
      }),
     AuthModule,
     PrismaModule,
     UsersModule,
     DocsModule,
     NotesModule,
     TasksModule
        ],
  providers: [
     {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    
  ],
})
export class AppModule {}
