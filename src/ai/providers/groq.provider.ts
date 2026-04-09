import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiProvider, AiProviderResponse } from './ai-provider.interface';
import { SummaryLength } from '../dto/ai.dto';

@Injectable()
export class GroqProvider extends AiProvider {
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private readonly httpService: HttpService) {
    super({
      apiKey: process.env.AI_API_KEY,
      baseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
      model: process.env.AI_MODEL || 'llama3-8b-8192',
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  getName(): string {
    return 'groq';
  }

  private getSummarySystemMessage(length: SummaryLength): string {
    const lengthInstructions = {
      [SummaryLength.SHORT]: 'Provide a concise summary in 2-3 sentences.',
      [SummaryLength.MEDIUM]:
        'Provide a comprehensive summary in 1-2 paragraphs.',
      [SummaryLength.DETAILED]:
        'Provide a detailed summary with key points and main concepts in 3-4 paragraphs.',
    };

    return `You are an expert at summarizing text content. ${lengthInstructions[length]} Focus on the main ideas and key concepts.`;
  }

  private getQuestionAnswerSystemMessage(): string {
    return `You are a helpful assistant that answers questions based on provided context. Only use the information given in the context to answer questions. If the answer cannot be found in the context, clearly state that you cannot find the answer in the provided information.`;
  }

  private async makeGroqRequest(
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
              Authorization: `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
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
        'Groq request failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        `Groq request failed: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async summarize(
    text: string,
    length: SummaryLength,
  ): Promise<AiProviderResponse> {
    const systemMessage = this.getSummarySystemMessage(length);
    const userMessage = `Please summarize this text:\n\n${text}`;

    return this.makeGroqRequest(systemMessage, userMessage);
  }

  async answerQuestion(
    question: string,
    context: string,
  ): Promise<AiProviderResponse> {
    const systemMessage = this.getQuestionAnswerSystemMessage();
    const userMessage = `Context:\n${context}\n\nQuestion: ${question}`;

    return this.makeGroqRequest(systemMessage, userMessage);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Groq currently doesn't have an embedding API, fallback or throw error
    throw new Error('Groq provider does not support embeddings yet. Please use OpenAI or another provider for embeddings.');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.logger.warn('Groq API key not provided');
      return false;
    }

    try {
      // Test with a simple request
      await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(
        'Groq availability check failed:',
        error.response?.data || error.message,
      );
      return false;
    }
  }

  supportsEmbeddings(): boolean {
    return false;
  }
}
