import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DocsModule } from './docs/docs.module';
import { NotesModule } from './notes/notes.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal:true
      })
    ,AuthModule, PrismaModule, UsersModule, DocsModule, NotesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
