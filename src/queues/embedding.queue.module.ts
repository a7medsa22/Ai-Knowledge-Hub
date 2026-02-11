import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmbeddingWorker } from '../workers/embedding.worker';
import { EmbeddingService } from '../ai/embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { Chunker } from '../ai/utils/chunker';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'embedding',
        }),
        AiModule,
    ],
    providers: [EmbeddingWorker, Chunker],
    exports: [BullModule],
})
export class EmbeddingQueueModule { }
