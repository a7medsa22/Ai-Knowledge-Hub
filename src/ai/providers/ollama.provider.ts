import {
  AiProvider,
  AiProviderConfig,
  AiProviderResponse,
} from './ai-provider.interface';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SummaryLength } from '../dto/ai.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OllamaProvider extends AiProvider {
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private configServise: ConfigService,
  ) {
    super({
      baseUrl: configServise.get('AI_BASE_URL') || 'http://127.0.0.1:11434',
      model: configServise.get('AI_MODEL') || 'phi3:3.8b',
      temperature: 0.7,
    });
  }
  getName(): string {
    return 'Ollama';
  }

  async summarize(
    text: string,
    length: SummaryLength,
  ): Promise<AiProviderResponse> {
    const prompt = this.getSummaryPrompt(text, length);
    return this.makeOllamaRequest(prompt);
  }
  async answerQuestion(
    question: string,
    context: string,
  ): Promise<AiProviderResponse> {
    const prompt = this.getQuestionAnswerPrompt(question, context);
    return this.makeOllamaRequest(prompt);
  }
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.config.baseUrl}/api/embed`, {
          model: this.config.model,
          prompt: text,
        }),
      );
      return response.data.embedding;
    } catch (error) {
      this.logger.error('Ollama embedding generation failed:', error.message);
      throw new Error(`Ollama embedding generation failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/api/tags`),
      );
      const models = response.data.models || [];
      const modelExists = models.some((model) =>
        model.name.includes(this.config.model.split(':')[0]),
      );

      if (!modelExists) {
        this.logger.warn(
          `Model ${this.config.model} not found in Ollama. Available models:`,
          models.map((m) => m.name),
        );
      }

      return modelExists;
    } catch (error) {
      this.logger.error('Ollama availability check failed:', error.message);
      return false;
    }
  }

  private getSummaryPrompt(text: string, length: SummaryLength) {
    const lengthInstructions = {
      [SummaryLength.SHORT]: 'Write a concise summary in 2-3 sentences.',
      [SummaryLength.MEDIUM]:
        'Write a comprehensive summary in 1-2 paragraphs.',
      [SummaryLength.DETAILED]:
        'Write a detailed summary with key points and main concepts in 3-4 paragraphs.',
    };
    return `Please summarize the following text. ${lengthInstructions[length]}
                  Text to summarize:${text}
                  Summary:`;
  }

  private getQuestionAnswerPrompt(question: string, context: string) {
    return `Please answer the following question based on the provided context.
                Question: ${question}
                Context: ${context}
                Answer:`;
  }

  private async makeOllamaRequest(prompt: string): Promise<AiProviderResponse> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.config.baseUrl}/api/generate`, {
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens || 512,
          },
        }),
      );
      const processingTime = Date.now() - startTime;

      return {
        result: response.data.response.trim(),
        model: this.config.model,
        processingTime,
      };
    } catch (error) {
      this.logger.error('Ollama request failed:', error.message);
      throw new Error(`Ollama AI request failed: ${error.message}`);
    }
  }
}
