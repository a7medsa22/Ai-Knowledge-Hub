import { AiProvider } from "./ai-provider.interface";
import { OpenAiProvider } from "./openai.provider";
import { OllamaProvider } from "./ollama.provider";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type AiProviderType = 'ollama' | 'openai' | 'anthropic';


@Injectable()
export class AiProviderFactory {
    private readonly logger = new Logger(AiProviderFactory.name);
    private providerCache = new Map<AiProviderType, AiProvider>();

    constructor(
        private readonly ollamaProvider: OllamaProvider,
        private readonly openAiProvider: OpenAiProvider,
        private readonly config:ConfigService ,
      ) {}
      async getProvider(providerType?:AiProviderType):Promise<AiProvider>{
    const selectedProvider = providerType || (this.config.get('AI_PROVIDER') as AiProviderType) || 'ollama';
        
    if(!this.providerCache.has(selectedProvider)){
        return this.providerCache.get(selectedProvider)!;
    }
    
    let provider: AiProvider;

    switch (selectedProvider) {
      case 'ollama':
        provider = this.ollamaProvider;
        break;
      case 'openai':
        provider = this.openAiProvider;
        break;
      case 'anthropic':
        // TODO: Implement Anthropic provider
        throw new Error('Anthropic provider not yet implemented');
      default:
        throw new Error(`Unsupported AI provider: ${selectedProvider}`);
    }
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      this.logger.error(`AI provider ${selectedProvider} is not available`);
      
      // Try to fallback to other providers
      const fallbackProvider = await this.getFallbackProvider(selectedProvider);
      if (fallbackProvider) {
        this.logger.warn(`Falling back to ${fallbackProvider.getName()} provider`);
        return fallbackProvider;
      }
      
      throw new Error(`AI provider ${selectedProvider} is not available and no fallback found`);
    }

    // Cache the provider
    this.providerCache.set(selectedProvider, provider);
    
    this.logger.log(`Using AI provider: ${provider.getName()}`);
    return provider;
  }

  private async getFallbackProvider(failedProvider: AiProviderType): Promise<AiProvider | null> {
    const fallbackOrder: AiProviderType[] = ['ollama', 'openai'];
    
    for (const providerType of fallbackOrder) {
      if (providerType === failedProvider) continue;
      
      try {
        const provider = providerType === 'ollama' 
          ? this.ollamaProvider 
          : this.openAiProvider;
          
        if (await provider.isAvailable()) {
          return provider;
        }
      } catch (error) {
        this.logger.debug(`Fallback provider ${providerType} also not available`);
      }
    }
    
    return null;
      }
      async getAvailableProviders(): Promise<string[]> {
        const providers: AiProviderType[] = ['ollama', 'openai'];
        const available: string[] = [];
    
        for (const providerType of providers) {
          try {
            const provider = providerType === 'ollama' 
              ? this.ollamaProvider 
              : this.openAiProvider;
              
            if (await provider.isAvailable()) {
              available.push(provider.getName());
            }
          } catch (error) {
            this.logger.debug(`Provider ${providerType} not available: ${error.message}`);
          }
        }
    
        return available;
      }
    
      clearCache(): void {
        this.providerCache.clear();
        this.logger.log('AI provider cache cleared');
      }

      

}