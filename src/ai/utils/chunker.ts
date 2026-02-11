import { Injectable } from '@nestjs/common';
import { RAG_CONFIG } from '../../config/rag.config';

@Injectable()
export class Chunker {
    static splitTextIntoChunks(
        text: string,
        chunkSize: number = RAG_CONFIG.chunkSize,
        overlap: number = RAG_CONFIG.chunkOverlap,
    ): string[] {
        if (!text) return [];

        // Normalize text (remove excessive newlines, etc.)
        const normalizedText = text.replace(/\s+/g, ' ').trim();

        if (normalizedText.length <= chunkSize) {
            return [normalizedText];
        }

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < normalizedText.length) {
            let endIndex = startIndex + chunkSize;

            // If we're not at the end of the text, try to break at a space
            if (endIndex < normalizedText.length) {
                const spaceIndex = normalizedText.lastIndexOf(' ', endIndex);
                // Only break at space if it's within the last 20% of the chunk to avoid too small chunks
                if (spaceIndex > startIndex + chunkSize * 0.8) {
                    endIndex = spaceIndex;
                }
            }

            const chunk = normalizedText.slice(startIndex, endIndex).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }

            // Move start index for next chunk, accounting for overlap
            startIndex = endIndex - overlap;

            // Prevent infinite loop if overlap is too big or no progress made
            if (startIndex >= endIndex) {
                startIndex = endIndex;
            }
        }

        return chunks;
    }
}
