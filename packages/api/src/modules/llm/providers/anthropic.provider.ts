import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, LlmOptions, LlmResponse } from '../interfaces/llm-provider.interface';

const ANTHROPIC_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-20250514',
];

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';

  async chat(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const client = new Anthropic({ apiKey: options?.['apiKey'] });
    const model = options?.model || 'claude-sonnet-4-20250514';

    const response = await client.messages.create({
      model,
      max_tokens: options?.maxTokens || 1024,
      ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    return {
      content: textBlock?.type === 'text' ? textBlock.text : '',
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async testConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return { success: true, message: 'Anthropic API 연결 성공' };
    } catch (error: any) {
      return { success: false, message: `Anthropic API 연결 실패: ${error.message}` };
    }
  }

  async listModels(_apiKey: string): Promise<string[]> {
    return ANTHROPIC_MODELS;
  }
}
