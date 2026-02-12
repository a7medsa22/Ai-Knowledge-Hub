import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { Chunker } from '../ai/utils/chunker';
import { AiModule } from '../ai/ai.module';
import { EmbeddingWorker } from 'src/workers/embedding.worker';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'embedding',
        }),
        forwardRef(() => AiModule),
    ],
    providers: [EmbeddingWorker, Chunker],
    exports: [BullModule],
})
export class EmbeddingQueueModule { }
