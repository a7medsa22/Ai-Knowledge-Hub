import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmbeddingService } from '../ai/embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { Chunker } from '../ai/utils/chunker';
import { ConfigService } from '@nestjs/config';

@Processor('embedding')
export class EmbeddingWorker extends WorkerHost {
    private readonly logger = new Logger(EmbeddingWorker.name);

    constructor(
        private readonly embeddingService: EmbeddingService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async process(job: Job<{ docId: string }>): Promise<any> {
        const { docId } = job.data;
        this.logger.log(`Processing embedding for document ${docId}`);

        try {
            const doc = await this.prisma.doc.findUnique({
                where: { id: docId },
            });

            if (!doc) {
                this.logger.error(`Document ${docId} not found`);
                return;
            }

            if (!doc.content) {
                this.logger.warn(`Document ${docId} has no content`);
                return;
            }

            // 1. Chunk the document
            const chunks = Chunker.splitTextIntoChunks(doc.content);
            this.logger.log(`Document split into ${chunks.length} chunks`);

            // 2. Generate embeddings for each chunk
            const embeddings = await this.embeddingService.generateEmbeddings(chunks);

            // 3. Store embeddings in database
            // Delete existing embeddings first to avoid duplicates on re-processing

            // delete manually because of cascade delete issue or to be safe
            await this.prisma.$executeRaw`DELETE FROM embeddings WHERE "docId" = ${docId}`;

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const vector = embeddings[i];

                await this.prisma.$executeRaw`
          INSERT INTO embeddings (id, "docId", content, vector, "chunkIndex", "createdAt")
          VALUES (gen_random_uuid(), ${docId}, ${chunk}, ${vector}::vector, ${i}, NOW())
        `;
            }

            this.logger.log(`Successfully processed embeddings for document ${docId}`);
            return { success: true, chunks: chunks.length };
        } catch (error) {
            this.logger.error(`Failed to process embedding for document ${docId}: ${error.message}`);
            throw error;
        }
    }
}
