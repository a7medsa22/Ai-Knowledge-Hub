import { Injectable, Logger } from '@nestjs/common';
import { AiProviderFactory } from './providers/ai-provider.factory';

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);

    constructor(private readonly aiProviderFactory: AiProviderFactory) { }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const provider = await this.aiProviderFactory.getProvider();
            return await provider.generateEmbedding(text);
        } catch (error) {
            this.logger.error(`Failed to generate embedding: ${error.message}`);
            throw error;
        }
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        // Sequential processing to avoid rate limits, consider batching if provider supports it
        for (const text of texts) {
            embeddings.push(await this.generateEmbedding(text));
        }
        return embeddings;
    }
}
