import OpenAI from 'openai';
import { LlmProvider, LlmOptions, LlmResponse } from '../interfaces/llm-provider.interface';

export class CustomProvider implements LlmProvider {
  readonly name = 'custom';
  private readonly baseURL: string;
  private readonly defaultApiKey: string;
  private readonly defaultModel: string;

  constructor(baseURL: string, apiKey: string, model: string) {
    this.baseURL = baseURL;
    this.defaultApiKey = apiKey;
    this.defaultModel = model;
  }

  async chat(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const client = new OpenAI({
      apiKey: options?.['apiKey'] || this.defaultApiKey,
      baseURL: this.baseURL,
    });
    const model = options?.model || this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: options?.maxTokens || 1024,
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    });

    const choice = response.choices[0];

    return {
      content: choice?.message?.content || '',
      model: response.model,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }

  async testConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = new OpenAI({
        apiKey: apiKey || this.defaultApiKey,
        baseURL: this.baseURL,
      });
      await client.chat.completions.create({
        model: model || this.defaultModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      });
      return { success: true, message: '커스텀 API 연결 성공' };
    } catch (error: any) {
      return { success: false, message: `커스텀 API 연결 실패: ${error.message}` };
    }
  }

  async listModels(_apiKey: string): Promise<string[]> {
    return [this.defaultModel];
  }
}
