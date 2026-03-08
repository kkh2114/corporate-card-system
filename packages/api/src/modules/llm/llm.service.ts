import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { LlmProvider, LlmOptions, LlmResponse } from './interfaces/llm-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { CustomProvider } from './providers/custom.provider';
import { LlmProviderType } from './dto/llm-config.dto';

interface LlmConfig {
  provider: LlmProviderType;
  apiKey: string;
  model?: string;
  endpoint?: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private currentProvider: LlmProvider | null = null;
  private currentConfig: LlmConfig | null = null;

  getAvailableProviders() {
    return [
      { name: 'anthropic', displayName: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-4-20250514', requiresEndpoint: false },
      { name: 'openai', displayName: 'OpenAI (GPT)', defaultModel: 'gpt-4o', requiresEndpoint: false },
      { name: 'google', displayName: 'Google (Gemini)', defaultModel: 'gemini-2.0-flash', requiresEndpoint: false },
      { name: 'custom', displayName: 'Custom (OpenAI Compatible)', defaultModel: '', requiresEndpoint: true },
    ];
  }

  getCurrentConfig() {
    if (!this.currentConfig) {
      return { provider: null, model: null, configured: false };
    }
    return {
      provider: this.currentConfig.provider,
      model: this.currentConfig.model || null,
      configured: true,
    };
  }

  setProvider(config: LlmConfig): void {
    this.currentProvider = this.createProvider(config);
    this.currentConfig = config;
    this.logger.log(`LLM provider set to: ${config.provider}`);
  }

  async chat(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    if (!this.currentProvider || !this.currentConfig) {
      throw new BadRequestException('LLM 프로바이더가 설정되지 않았습니다.');
    }

    const mergedOptions: LlmOptions & { apiKey: string } = {
      ...options,
      model: options?.model || this.currentConfig.model,
      apiKey: this.currentConfig.apiKey,
    };

    try {
      return await this.currentProvider.chat(prompt, mergedOptions);
    } catch (error: any) {
      this.logger.error(`LLM chat failed: ${error.message}`);
      throw new BadRequestException(`LLM 호출 실패: ${error.message}`);
    }
  }

  async testConnection(
    providerType: LlmProviderType,
    apiKey: string,
    model?: string,
    endpoint?: string,
  ): Promise<{ success: boolean; message: string }> {
    const provider = this.createProvider({ provider: providerType, apiKey, endpoint });
    return provider.testConnection(apiKey, model);
  }

  async listModels(
    providerType: LlmProviderType,
    apiKey: string,
    endpoint?: string,
  ): Promise<string[]> {
    const provider = this.createProvider({ provider: providerType, apiKey, endpoint });
    return provider.listModels(apiKey);
  }

  isConfigured(): boolean {
    return this.currentProvider !== null;
  }

  private createProvider(config: LlmConfig): LlmProvider {
    switch (config.provider) {
      case LlmProviderType.ANTHROPIC:
        return new AnthropicProvider();
      case LlmProviderType.OPENAI:
        return new OpenAIProvider();
      case LlmProviderType.GOOGLE:
        return new GoogleProvider();
      case LlmProviderType.CUSTOM:
        if (!config.endpoint) {
          throw new BadRequestException('커스텀 프로바이더는 엔드포인트 URL이 필요합니다.');
        }
        return new CustomProvider(config.endpoint, config.apiKey, config.model || 'default');
      default:
        throw new BadRequestException(`지원하지 않는 프로바이더: ${config.provider}`);
    }
  }
}
