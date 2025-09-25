import { AiProvider, AiProviderConfig } from "./ai-provider.interface";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OllamaProvider extends AiProvider {
    private readonly logger = new Logger(OllamaProvider.name);

    constructor(private readonly httpService:HttpService , private config:ConfigService) {
        super({
            baseUrl:config.get('AI_BASE_URL')|| 'http://localhost:11434',
            model:config.get('AI_MODEL') || 'phi3:3.8b',
            temperature: 0.7,
        })
    }

    getName(): string {
        return 'Ollama';
    }
}