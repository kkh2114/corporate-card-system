export interface LlmProvider {
  readonly name: string;
  chat(prompt: string, options?: LlmOptions): Promise<LlmResponse>;
  testConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }>;
  listModels(apiKey: string): Promise<string[]>;
}

export interface LlmOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}
