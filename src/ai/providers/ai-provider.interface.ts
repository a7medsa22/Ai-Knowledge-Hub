import { SummaryLength } from "../dto/ai.dto";

export interface AiProviderResponse {
  result: string;
  model: string;
  processingTime: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
export abstract class AiProvider {
    protected config: AiProviderConfig;
    
    constructor(config: AiProviderConfig) {
      this.config = config;
    }
  
    abstract getName(): string;
    
    abstract summarize(
      text: string, 
      length: SummaryLength
    ): Promise<AiProviderResponse>;
    
    abstract answerQuestion(
      question: string, 
      context: string
    ): Promise<AiProviderResponse>;
    
    abstract generateEmbedding(text: string): Promise<number[]>;
    
    abstract isAvailable():  Promise<boolean>;
  }