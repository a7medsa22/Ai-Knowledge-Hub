import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { DocsService } from 'src/docs/docs.service';
import { QuestionAnswerDto, QuestionAnswerResponseDto, SemanticSearchDto, SummarizeDto, SummarizeResponseDto, SummaryLength } from './dto/ai.dto';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);  
    
    constructor(
        private readonly aiProviderFactory:AiProviderFactory,
        private readonly docsService:DocsService,
    ){}
    private async getTextContent(
        text?: string,
        docId?: string,
        userId?: string,
      ): Promise<{ content: string; source: string }> {
        if (text && docId) {
          throw new BadRequestException('Provide either text or docId, not both');
        }
    
        if (!text && !docId) {
          throw new BadRequestException('Either text or docId must be provided');
        }
    
        if (text) {
          return { content: text, source: 'direct' };
        }
    
        // Get document content
        const doc = await this.docsService.findOne(docId!, userId);
        if (!doc) {
          throw new NotFoundException('Document not found');
        }
    
        return { 
          content: `${doc.title}\n\n${doc.content}`, 
          source: `doc:${doc.id}` 
        };
      }
      async summarize(
        summarizeDto: SummarizeDto,
        userId?: string,
      ): Promise<SummarizeResponseDto> {
        const { text, docId, length = SummaryLength.MEDIUM } = summarizeDto;

        this.logger.log(`Summarization request - Length: ${length}, Source: ${docId ? 'doc' : 'text'}`);

        const { content, source } = await this.getTextContent(text, docId, userId);
        if (content.length < 50) {
            throw new BadRequestException('Content is too short to summarize (minimum 50 characters)');
          }
      
          if (content.length > 50000) {
            throw new BadRequestException('Content is too long to summarize (maximum 50,000 characters)');
          }

       // Get AI provider and generate summary
    const provider = await this.aiProviderFactory.getProvider();
    const startTime = Date.now();
    try{
        const response  =  await provider.summarize(content,length);
        const result: SummarizeResponseDto = {
            summary: response.result,
            result: response.result,
            provider: provider.getName(),
            model: response.model,
            processingTime: Date.now() - startTime,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            length,
            originalTextLength: content.length,
          };

          this.logger.log(`Summarization completed in ${result.processingTime}ms using ${result.provider}`);


        //  Save summary back to document if docId provided
          if (docId && userId) {
            try {
              await this.docsService.update(docId, userId, { 
                summary: response.result,
                       });
              this.logger.log(`Summary saved to document ${docId}`);
            } catch (error) {
              this.logger.warn(`Failed to save summary to document: ${error.message}`);
            }
          }
    
          return result;
    }catch(error){
        this.logger.error(`Summarization failed - Error: ${error.message}`);
        throw error;
    }

  }
  async answerQuestion(
    questionAnswerDto: QuestionAnswerDto,
    userId?: string,
  ): Promise<QuestionAnswerResponseDto> {
    const { question, context, docId } = questionAnswerDto;

    this.logger.log(`Q&A request - Question: "${question.substring(0, 50)}..."`);

    // Get context content
    const { content } = await this.getTextContent(context, docId, userId);

    // Validate question
    if (question.length <= 5) {
      throw new BadRequestException('Question is too short (minimum 5 characters)');
    }

    // Validate context length
    if (content.length <= 20) {
      throw new BadRequestException('Context is too short to answer questions (minimum 20 characters)');
    }

    if (content.length >= 30000) {
      // Truncate if too long
      this.logger.warn('Context too long, truncating to 30,000 characters');
      content.substring(0, 30000);
    }

    // Get AI provider and generate answer
    const provider = await this.aiProviderFactory.getProvider();
    const startTime = Date.now();

    try {
      const response = await provider.answerQuestion(question, content);

      const result: QuestionAnswerResponseDto = {
        answer: response.result,
        result: response.result,
        question,
        provider: provider.getName(),
        model: response.model,
        processingTime: Date.now() - startTime,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      };

      this.logger.log(`Q&A completed in ${result.processingTime}ms using ${result.provider}`);

      return result;
    } catch (error) {
      this.logger.error(`Q&A failed: ${error.message}`);
      throw new BadRequestException(`AI question answering failed: ${error.message}`);
    }
  }

  async semanticSearch(
    searchDto: SemanticSearchDto,
    userId?: string,
  ): Promise<any> {
    const { query, limit = 5 } = searchDto;

    this.logger.log(`Semantic search request - Query: "${query}"`);

    // Get AI provider
    const provider = await this.aiProviderFactory.getProvider();

    try {
      // Generate embedding for search query
      const queryEmbedding = await provider.generateEmbedding(query);

      // TODO: Implement vector similarity search in database
      // For now, return a placeholder response
      this.logger.warn('Semantic search not fully implemented yet. Using basic text search fallback.');

      // Fallback to basic text search
      const results = await this.docsService.findAll({
        query,
        limit,
        offset: 0,
      });

      return {
        ...results,
        searchType: 'text-fallback',
        message: 'Semantic search coming soon. Using text search for now.',
        provider: provider.getName(),
      };
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      throw new BadRequestException(`Semantic search failed: ${error.message}`);
    }
  }

  // Utility methods
  async getAiStatus(): Promise<{
    available: boolean;
    providers: string[];
    currentProvider: string;
    model: string;
  }> {
    try {
      const availableProviders = await this.aiProviderFactory.getAvailableProviders();
      const currentProvider = await this.aiProviderFactory.getProvider();

      return {
        available: availableProviders.length > 0,
        providers: availableProviders,
        currentProvider: currentProvider.getName(),
        model: process.env.AI_MODEL || 'unknown',
      };
    } catch (error) {
      this.logger.error(`AI status check failed: ${error.message}`);
      return {
        available: false,
        providers: [],
        currentProvider: 'none',
        model: 'none',
      };
    }
  }

  async generateBulkSummaries(
    docIds: string[],
    userId: string,
    length: SummaryLength = SummaryLength.MEDIUM,
  ): Promise<Array<{ docId: string; summary: string; error?: string }>> {
    this.logger.log(`Bulk summarization request for ${docIds.length} documents`);

    const results: Array<{ docId: string; summary: string; error?: string }> = [];

    for (const docId of docIds) {
      try {
        const result = await this.summarize({ docId, length }, userId);
        results.push({
          docId,
          summary: result.summary,
        });
      } catch (error) {
        this.logger.error(`Failed to summarize document ${docId}: ${error.message}`);
        results.push({
          docId,
          summary: '',
          error: error.message,
        });
      }
    }

    return results;
  }

  // Extract key points from text
  async extractKeyPoints(
    text: string,
    count: number = 5,
  ): Promise<string[]> {
    this.logger.log(`Extracting ${count} key points from text`);

    const provider = await this.aiProviderFactory.getProvider();

    // Create a custom prompt for key point extraction
    const customPrompt = `Extract the ${count} most important key points from this text. Return only the key points as a numbered list:\n\n${text}`;

    try {
      const response = await provider.summarize(text, SummaryLength.MEDIUM);
      
      // Parse the response to extract numbered points
      const points = response.result
        .split('\n')
        .filter(line => line.match(/^\d+\.|^-|^•/))
        .map(line => line.replace(/^\d+\.\s*|^-\s*|^•\s*/, '').trim())
        .slice(0, count);

      return points;
    } catch (error) {
      this.logger.error(`Key point extraction failed: ${error.message}`);
      throw new BadRequestException(`Key point extraction failed: ${error.message}`);
    }
  }
    

}
