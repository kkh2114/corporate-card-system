import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmProvider, LlmOptions, LlmResponse } from '../interfaces/llm-provider.interface';

const GOOGLE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

export class GoogleProvider implements LlmProvider {
  readonly name = 'google';

  async chat(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const genAI = new GoogleGenerativeAI(options?.['apiKey'] || '');
    const modelName = options?.model || 'gemini-2.0-flash';

    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(options?.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 1024,
        ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      },
    });

    const response = result.response;
    const usage = response.usageMetadata;

    return {
      content: response.text(),
      model: modelName,
      usage: usage
        ? {
            inputTokens: usage.promptTokenCount ?? 0,
            outputTokens: usage.candidatesTokenCount ?? 0,
          }
        : undefined,
    };
  }

  async testConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash' });
      await genModel.generateContent('ping');
      return { success: true, message: 'Google AI API 연결 성공' };
    } catch (error: any) {
      return { success: false, message: `Google AI API 연결 실패: ${error.message}` };
    }
  }

  async listModels(_apiKey: string): Promise<string[]> {
    return GOOGLE_MODELS;
  }
}
