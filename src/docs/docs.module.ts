import { forwardRef, Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { DocsResolver } from './docs.resolver';
import { FilesModule } from 'src/files/files.module';
import { EmbeddingQueueModule } from '../queues/embedding.queue.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, FilesModule, EmbeddingQueueModule],
  controllers: [DocsController],
  providers: [DocsService, DocsResolver],
  exports: [DocsService],
})
export class DocsModule { }
