// ==========================================
// TIPOS COMUNS PARA PROVIDERS DE IA
// ==========================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  context?: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  error?: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(request: AIRequest): Promise<AIResponse>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  timeout?: number;
}
