import { AIProvider, AIRequest, AIResponse } from './types';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel = 'openrouter/free';
  private timeout: number;

  constructor(config?: { apiKey?: string; model?: string; timeout?: number }) {
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = config?.model || this.defaultModel;
    this.timeout = config?.timeout || 30000;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('[PROVIDER_OPENROUTER] API key não configurada');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages = [...request.messages];

      // Adicionar contexto se fornecido
      if (request.context) {
        const systemMessage = messages.find(m => m.role === 'system');
        if (systemMessage) {
          systemMessage.content = `${systemMessage.content}\n\nContexto relevante:\n${request.context}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://clickmarido.com.br',
          'X-Title': 'ClickMarido AI',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          content: '',
          provider: this.name,
          model: this.defaultModel,
          latencyMs: Date.now() - startTime,
          error: `HTTP ${response.status}: ${error}`,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        content,
        provider: this.name,
        model: this.defaultModel,
        tokensUsed: data.usage?.total_tokens,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        provider: this.name,
        model: this.defaultModel,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
