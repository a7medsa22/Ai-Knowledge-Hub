import { AiProvider } from './ai-provider.interface';
import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDERS_TOKEN } from '../ai.constants';

export type AiProviderType = 'ollama' | 'openai' | 'anthropic' | 'groq';

@Injectable()
export class AiProviderFactory implements OnModuleInit {
  private readonly logger = new Logger(AiProviderFactory.name);
  private providerCache = new Map<string, AiProvider>();
  private providerRegistry = new Map<string, AiProvider>();

  constructor(
    @Inject(AI_PROVIDERS_TOKEN) private readonly providers: AiProvider[],
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.providers.forEach((provider) => {
      const name = provider.getName().toLowerCase();
      this.providerRegistry.set(name, provider);
      this.logger.log(`Registered AI provider: ${name}`);
    });
  }

  async getProvider(providerType?: string): Promise<AiProvider> {
    const selectedProvider = (
      providerType ||
      this.config.get('AI_PROVIDER') ||
      'ollama' 
    ).toLowerCase();

    this.logger.log(`Selecting AI provider: ${selectedProvider}`);

    if (this.providerCache.has(selectedProvider)) {
      return this.providerCache.get(selectedProvider)!;
    }

    const provider = this.providerRegistry.get(selectedProvider);

    if (!provider) {
      throw new Error(`AI provider ${selectedProvider} is not registered`);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      this.logger.error(`AI provider ${selectedProvider} is not available`);

      const fallbackProvider = await this.getFallbackProvider(selectedProvider);
      if (fallbackProvider) {
        this.logger.warn(
          `Falling back to ${fallbackProvider.getName()} provider`,
        );
        return fallbackProvider;
      }

      throw new Error(
        `AI provider ${selectedProvider} is not available and no fallback found`,
      );
    }

    this.providerCache.set(selectedProvider, provider);
    return provider;
  }

  async getEmbeddingProvider(): Promise<AiProvider> {
    const preferredProvider =
      this.config.get('EMBEDDING_PROVIDER') || this.config.get('AI_PROVIDER');

    if (preferredProvider) {
      const provider = this.providerRegistry.get(preferredProvider.toLowerCase());
      if (provider && provider.supportsEmbeddings() && (await provider.isAvailable())) {
        return provider;
      }
    }

    // If preferred provider doesn't support embeddings, find one that does
    for (const [name, provider] of this.providerRegistry) {
      if (provider.supportsEmbeddings() && (await provider.isAvailable())) {
        this.logger.log(`Using ${name} as embedding provider fallback`);
        return provider;
      }
    }

    throw new Error('No available AI provider supports embeddings');
  }

  private async getFallbackProvider(
    failedProvider: string,
  ): Promise<AiProvider | null> {
    const fallbackOrder = ['ollama', 'openai', 'groq'];

    for (const providerName of fallbackOrder) {
      if (providerName === failedProvider) continue;

      const provider = this.providerRegistry.get(providerName);
      if (!provider) continue;

      try {
        if (await provider.isAvailable()) {
          return provider;
        }
      } catch (error) {
        this.logger.debug(
          `Fallback provider ${providerName} also not available`,
        );
      }
    }

    return null;
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];

    for (const [name, provider] of this.providerRegistry) {
      try {
        if (await provider.isAvailable()) {
          available.push(name);
        }
      } catch (error) {
        this.logger.debug(`Provider ${name} not available: ${error.message}`);
      }
    }

    return available;
  }

  clearCache(): void {
    this.providerCache.clear();
    this.logger.log('AI provider cache cleared');
  }
}
