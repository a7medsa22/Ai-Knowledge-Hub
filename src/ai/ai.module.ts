import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { HttpModule } from '@nestjs/axios';
import { DocsModule } from '../docs/docs.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotesModule } from 'src/notes/notes.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[
    ConfigModule.forRoot({
      isGlobal:true
    }),
    HttpModule,
    PrismaModule,
    AuthModule,
    NotesModule,
    UsersModule,
    DocsModule    
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
