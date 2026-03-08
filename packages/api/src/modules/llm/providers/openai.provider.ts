import OpenAI from 'openai';
import { LlmProvider, LlmOptions, LlmResponse } from '../interfaces/llm-provider.interface';

export class OpenAIProvider implements LlmProvider {
  readonly name = 'openai';

  async chat(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const client = new OpenAI({ apiKey: options?.['apiKey'] });
    const model = options?.model || 'gpt-4o';

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
      const client = new OpenAI({ apiKey });
      await client.chat.completions.create({
        model: model || 'gpt-4o',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      });
      return { success: true, message: 'OpenAI API 연결 성공' };
    } catch (error: any) {
      return { success: false, message: `OpenAI API 연결 실패: ${error.message}` };
    }
  }

  async listModels(apiKey: string): Promise<string[]> {
    try {
      const client = new OpenAI({ apiKey });
      const response = await client.models.list();
      const models: string[] = [];
      for await (const model of response) {
        if (model.id.includes('gpt')) {
          models.push(model.id);
        }
      }
      return models.sort();
    } catch {
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    }
  }
}
