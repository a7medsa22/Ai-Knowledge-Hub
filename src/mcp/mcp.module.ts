import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';
import { DocsModule } from 'src/docs/docs.module';
import { NotesModule } from 'src/notes/notes.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[DocsModule
    , NotesModule, TasksModule,PrismaModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
