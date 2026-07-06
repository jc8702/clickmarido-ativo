import { AIProvider, AIRequest, AIResponse } from './types';
import { OpenRouterProvider } from './openrouter';
import { KiloProvider } from './kilo';

// ==========================================
// ORQUESTRADOR DE PROVIDERS DE IA
// Gerencia fallback automático entre providers
// ==========================================

export class AIProviderOrchestrator {
  private providers: AIProvider[] = [];
  private activeProvider: AIProvider | null = null;
  private logs: Array<{
    timestamp: Date;
    provider: string;
    action: string;
    success: boolean;
    details?: string;
  }> = [];

  constructor() {
    // Inicializar providers na ordem de prioridade
    this.providers = [
      new OpenRouterProvider(),
      new KiloProvider(),
    ];
  }

  // Verificar qual provider está disponível
  async initialize(): Promise<AIProvider | null> {
    for (const provider of this.providers) {
      const available = await provider.isAvailable();
      
      this.log(provider.name, 'availability_check', available);

      if (available) {
        this.activeProvider = provider;
        this.log(provider.name, 'selected', true, 'Provider principal selecionado');
        console.log(`[AI_PROVIDER] Provider ativo: ${provider.name}`);
        return provider;
      }
    }

    this.log('none', 'initialization', false, 'Nenhum provider disponível');
    console.warn('[AI_PROVIDER] Nenhum provider gratuito disponível');
    return null;
  }

  // Gerar resposta com fallback automático
  async generate(request: AIRequest): Promise<AIResponse> {
    // Tentar providers em ordem
    for (const provider of this.providers) {
      const available = await provider.isAvailable();
      
      if (!available) {
        this.log(provider.name, 'skipped', false, 'Provider indisponível');
        continue;
      }

      this.log(provider.name, 'attempt', true, 'Tentando gerar resposta');
      
      const response = await provider.generate(request);
      
      if (response.success) {
        this.log(provider.name, 'success', true, `Tokens: ${response.tokensUsed}, Latência: ${response.latencyMs}ms`);
        this.activeProvider = provider;
        return response;
      }

      this.log(provider.name, 'failed', false, response.error);
      console.warn(`[AI_PROVIDER] Provider ${provider.name} falhou: ${response.error}`);
    }

    // Nenhum provider funcionou
    return {
      success: false,
      content: '',
      provider: 'none',
      model: 'none',
      latencyMs: 0,
      error: 'Nenhum provider de IA disponível no momento',
    };
  }

  // Obter provider ativo
  getActiveProvider(): AIProvider | null {
    return this.activeProvider;
  }

  // Obter logs
  getLogs() {
    return [...this.logs];
  }

  // Limpar logs antigos (manter últimos 1000)
  clearOldLogs() {
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  private log(provider: string, action: string, success: boolean, details?: string) {
    this.logs.push({
      timestamp: new Date(),
      provider,
      action,
      success,
      details,
    });
    this.clearOldLogs();
  }
}

// Instância singleton
let orchestratorInstance: AIProviderOrchestrator | null = null;

export function getAIOrchestrator(): AIProviderOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AIProviderOrchestrator();
  }
  return orchestratorInstance;
}
