import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiProvider, AiProviderResponse } from './ai-provider.interface';
import { SummaryLength } from '../dto/ai.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenRouterProvider extends AiProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super({
      apiKey: configService.get('OPENROUTER_API_KEY'),
      baseUrl: 'https://openrouter.ai/api/v1',
      model: configService.get('AI_MODEL') || 'mistralai/ministral-14b-2512',
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  getName(): string {
    return 'openrouter';
  }

  private getSummarySystemMessage(length: SummaryLength): string {
    const lengthInstructions = {
      [SummaryLength.SHORT]: 'Provide a concise summary in 2-3 sentences.',
      [SummaryLength.MEDIUM]: 'Provide a comprehensive summary in 1-2 paragraphs.',
      [SummaryLength.DETAILED]: 'Provide a detailed summary with key points and main concepts in 3-4 paragraphs.',
    };

    return `You are an expert at summarizing text content. ${lengthInstructions[length]} Focus on the main ideas and key concepts.`;
  }

  private getQuestionAnswerSystemMessage(): string {
    return `You are a helpful assistant that answers questions based on provided context. Only use the information given in the context to answer questions. If the answer cannot be found in the context, clearly state that you cannot find the answer in the provided information.`;
  }

  private async makeOpenRouterRequest(
    systemMessage: string,
    userMessage: string,
    maxTokens?: number,
  ): Promise<AiProviderResponse> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/chat/completions`,
          {
            model: this.config.model,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage },
            ],
            temperature: this.config.temperature,
            max_tokens: maxTokens || this.config.maxTokens,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
              'X-Title': 'AI Research Hub', // Optional
            },
          },
        ),
      );

      const processingTime = Date.now() - startTime;
      const choice = response.data.choices[0];

      return {
        result: choice.message.content.trim(),
        model: this.config.model,
        processingTime,
        inputTokens: response.data.usage?.prompt_tokens,
        outputTokens: response.data.usage?.completion_tokens,
      };
    } catch (error) {
      this.logger.error(
        'OpenRouter request failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        `OpenRouter request failed: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async summarize(
    text: string,
    length: SummaryLength,
  ): Promise<AiProviderResponse> {
    const systemMessage = this.getSummarySystemMessage(length);
    const userMessage = `Please summarize this text:\n\n${text}`;

    return this.makeOpenRouterRequest(systemMessage, userMessage);
  }

  async answerQuestion(
    question: string,
    context: string,
  ): Promise<AiProviderResponse> {
    const systemMessage = this.getQuestionAnswerSystemMessage();
    const userMessage = `Context:\n${context}\n\nQuestion: ${question}`;

    return this.makeOpenRouterRequest(systemMessage, userMessage);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/embeddings`,
          {
            model: 'openai/text-embedding-3-small', // High quality & low cost on OpenRouter
            input: text,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
            },
          },
        ),
      );

      // OpenRouter returns embeddings in data[0].embedding or directly
      return response.data.data[0].embedding;
    } catch (error) {
      this.logger.error(
        'OpenRouter embedding request failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        `OpenRouter embedding failed: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.logger.warn('OpenRouter API key not provided');
      return false;
    }
    return true;
  }

  supportsEmbeddings(): boolean {
    return true;
  }
}
