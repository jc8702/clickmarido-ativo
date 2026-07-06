import { AIProvider, AIRequest, AIResponse } from './types';

// ==========================================
// KILO PROVIDER
// Fallback opcional - funciona via curl mas pode ter restrições com Node.js fetch
// ==========================================

export class KiloProvider implements AIProvider {
  name = 'kilo';
  private apiKey: string;
  private baseUrl = 'https://api.kilo.ai/api/gateway';
  private defaultModel = 'openrouter/free';
  private timeout: number;

  constructor(config?: { apiKey?: string; model?: string; timeout?: number }) {
    this.apiKey = config?.apiKey || process.env.KILO_API_KEY || '';
    this.defaultModel = config?.model || this.defaultModel;
    this.timeout = config?.timeout || 30000;
  }

  async isAvailable(): Promise<boolean> {
    // Kilo pode ter restrições com fetch do Node.js
    // Usar apenas se OpenRouter falhar
    if (!this.apiKey) {
      return false;
    }
    
    console.log('[PROVIDER_KILO] Disponível como fallback');
    return true;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages = [...request.messages];

      if (request.context) {
        const systemMessage = messages.find(m => m.role === 'system');
        if (systemMessage) {
          systemMessage.content = `${systemMessage.content}\n\nContexto relevante:\n${request.context}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
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
      let content = data.choices?.[0]?.message?.content || '';
      
      if (!content && data.choices?.[0]?.message?.reasoning) {
        content = data.choices[0].message.reasoning;
      }
      
      if (!content) {
        content = 'Desculpe, não consegui gerar uma resposta.';
      }

      return {
        success: true,
        content,
        provider: this.name,
        model: data.model || this.defaultModel,
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
