import { routeIntent, Intent, IntentResult, logRoute } from './intent-router';
import { buildContext, getKnowledgeBaseStats } from './rag-engine';
import { getAIOrchestrator } from './providers';
import { AIMessage, AIResponse } from './providers/types';
import { logChat } from './logs';

// ==========================================
// AGENTE PRINCIPAL DO CLICKMARIDO
// Orquestra roteamento, RAG e geração de resposta
// ==========================================

export interface ChatRequest {
  message: string;
  userId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  intent: IntentResult;
  provider: string;
  model: string;
  needsEscalation: boolean;
  escalationReason?: string;
  clarificationNeeded: boolean;
  clarificationMessage?: string;
  latencyMs: number;
  logs: {
    intentClassification: any;
    ragSearch: any;
    providerAttempt: any;
  };
}

// System prompt para o LLM
const SYSTEM_PROMPT = `Você é o assistente virtual do ClickMarido, um sistema de gestão para empresas de serviços residenciais.

Suas responsabilidades:
- Responder dúvidas sobre serviços: Elétrica, Hidráulica, Automação Residencial, Montagem de Móveis
- Orientar sobre uso do sistema (CRM)
- Ajudar em procedimentos operacionais
- Escalar para humano quando necessário

Regras:
1. Responda APENAS com base no contexto fornecido
2. Não invente informações
3. Seja claro, direto e profissional
4. Use linguagem simples e acessível
5. Se não souber, diga que vai buscar a informação
6. Para emergências ou riscos, oriente a buscar ajuda imediata
7. Use PT-BR formal mas acessível

Formato de resposta:
- Respostas curtas (1-3 frases quando possível)
- Listas para múltiplos pontos
- Passos numerados para procedimentos
- Negrito para termos importantes

Contexto disponível será fornecido entre marcadores [CONTEXTO]...[/CONTEXTO].`;

// Prompt para pedir esclarecimento
const CLARIFICATION_PROMPT = `O usuário fez uma pergunta que não ficou clara. 
Responda de forma amigável pedindo mais detalhes. 
Sugira opções relacionadas ao sistema ClickMarido:
- Dúvidas sobre serviços (elétrica, hidráulica, automação, móveis)
- Dúvidas sobre o sistema
- Abrir um chamado
- Verificar status de solicitação`;

// Prompt para escalonamento
const ESCALATION_PROMPT = `O usuário precisa de atendimento humano.
Responda de forma amigável explicando que vai conectar com um especialista.
Mantenha tom profissional e empático.`;

export async function processMessage(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  
  // 1. Classificar intenção
  const intentResult = routeIntent(request.message, 
    request.conversationHistory?.map(h => h.content)
  );
  
  logRoute(request.message, intentResult);
  
  // 2. Verificar se precisa de escalação
  if (intentResult.needsEscalation) {
    const response = await generateEscalationResponse(request, intentResult);
    return {
      success: true,
      content: response.content,
      intent: intentResult,
      provider: response.provider,
      model: response.model,
      needsEscalation: true,
      escalationReason: intentResult.escalationReason,
      clarificationNeeded: false,
      latencyMs: Date.now() - startTime,
      logs: {
        intentClassification: intentResult,
        ragSearch: null,
        providerAttempt: response,
      },
    };
  }
  
  // 3. Verificar se precisa de esclarecimento
  if (intentResult.needsClarification) {
    return {
      success: true,
      content: intentResult.clarificationMessage || 'Poderia me dar mais detalhes?',
      intent: intentResult,
      provider: 'rule-based',
      model: 'none',
      needsEscalation: false,
      clarificationNeeded: true,
      clarificationMessage: intentResult.clarificationMessage,
      latencyMs: Date.now() - startTime,
      logs: {
        intentClassification: intentResult,
        ragSearch: null,
        providerAttempt: null,
      },
    };
  }
  
  // 4. Buscar contexto relevante
  const context = buildContext(request.message, intentResult.primary);
  
  // 5. Gerar resposta com IA
  const response = await generateAIResponse(request, intentResult, context);
  
  const finalResponse: ChatResponse = {
    success: response.success,
    content: response.content,
    intent: intentResult,
    provider: response.provider,
    model: response.model,
    needsEscalation: false,
    clarificationNeeded: false,
    latencyMs: Date.now() - startTime,
    logs: {
      intentClassification: intentResult,
      ragSearch: { contextLength: context.length },
      providerAttempt: response,
    },
  };

  // 6. Registrar log
  logChat({
    userId: request.userId,
    message: request.message,
    intent: intentResult.primary,
    provider: response.provider,
    model: response.model,
    success: response.success,
    latencyMs: finalResponse.latencyMs,
    needsEscalation: false,
  });

  return finalResponse;
}

// Gerar resposta de escalação
async function generateEscalationResponse(
  request: ChatRequest,
  intentResult: IntentResult
): Promise<AIResponse> {
  const orchestrator = getAIOrchestrator();
  
  const messages: AIMessage[] = [
    { role: 'system', content: ESCALATION_PROMPT },
    { role: 'user', content: request.message },
  ];
  
  const response = await orchestrator.generate({
    messages,
    temperature: 0.7,
    maxTokens: 256,
  });
  
  if (!response.success) {
    // Fallback para resposta estática
    return {
      success: true,
      content: 'Vou conectar você com um especialista para melhor atender. Por favor, aguarde um momento.',
      provider: 'fallback',
      model: 'static',
      latencyMs: 0,
    };
  }
  
  return response;
}

// Gerar resposta com IA
async function generateAIResponse(
  request: ChatRequest,
  intentResult: IntentResult,
  context: string
): Promise<AIResponse> {
  const orchestrator = getAIOrchestrator();
  
  // Construir mensagens
  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];
  
  // Adicionar histórico se disponível
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    // Limitar a últimos 5 exchanges
    const recentHistory = request.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }
  
  // Adicionar mensagem atual com contexto
  const userMessage = context
    ? `${request.message}\n\n[CONTEXTO]\n${context}\n[/CONTEXTO]`
    : request.message;
  
  messages.push({ role: 'user', content: userMessage });
  
  // Gerar resposta
  const response = await orchestrator.generate({
    messages,
    temperature: 0.7,
    maxTokens: 1024,
  });
  
  if (!response.success) {
    // Fallback para resposta baseada em regras
    return generateRuleBasedResponse(request, intentResult, context);
  }
  
  return response;
}

// Fallback: resposta baseada em regras
function generateRuleBasedResponse(
  request: ChatRequest,
  intentResult: IntentResult,
  context: string
): AIResponse {
  const startTime = Date.now();
  
  let content = '';
  
  // Respostas pré-definidas por intenção
  switch (intentResult.primary) {
    case 'servico_eletrica':
      content = 'Para serviços de elétrica, posso ajudar com:\n\n• Instalação e reparo de tomadas\n• Substituição de disjuntores\n• Reparo em fiação\n• Iluminação\n\nPara orçamento, acesse **Orçamentos** → **Novo Orçamento** e selecione "Elétrica".';
      break;
      
    case 'servico_hidraulica':
      content = 'Para serviços de hidráulica, posso ajudar com:\n\n• Reparo de vazamentos\n• Substituição de torneiras\n• Desentupimento\n• Manutenção em caixas d\'água\n\nPara orçamento, acesse **Orçamentos** → **Novo Orçamento** e selecione "Hidráulica".';
      break;
      
    case 'servico_automacao_residencial':
      content = 'Para automação residencial, posso ajudar com:\n\n• Portões eletrônicos\n• Fechaduras digitais\n• Câmeras de segurança\n• Integração com Alexa/Google\n\nPara orçamento, acesse **Orçamentos** → **Novo Orçamento** e selecione "Automação".';
      break;
      
    case 'servico_montagem_moveis':
      content = 'Para montagem de móveis, posso ajudar com:\n\n• Montagem de armários, estantes, mesas\n• Desmontagem para mudança\n• Reparo em gavetas e portas\n• Fixação em paredes\n\nPara orçamento, acesse **Orçamentos** → **Novo Orçamento** e selecione "Montagem".';
      break;
      
    case 'sistema_uso_geral':
      content = 'Sobre o uso do sistema, posso ajudar com:\n\n• Navegação\n• Cadastro de clientes\n• Criação de orçamentos\n• Gestão de OS\n• Pagamentos\n\nQual funcionalidade específica você quer saber?';
      break;
      
    case 'sistema_modulos':
      content = 'Os módulos do sistema incluem:\n\n• **Dashboard** - Visão geral\n• **Clientes** - Cadastro e gestão\n• **Orçamentos** - Propostas\n• **Ordens de Serviço** - Execução\n• **Pagamentos** - Cobranças\n• **Relatórios** - Análises\n\nQual módulo você quer usar?';
      break;
      
    case 'suporte_tecnico':
      content = 'Para suporte técnico:\n\n1. Descreva o problema detalhadamente\n2. Tire um print se possível\n3. Anote os passos que deu\n4. Abra um chamado em **Suporte** → **Novo Chamado**';
      break;
      
    case 'abertura_chamado':
      content = 'Para abrir um chamado:\n\n1. Acesse **Suporte** → **Novo Chamado**\n2. Selecione a categoria\n3. Descreva o problema\n4. Anexe prints se necessário\n5. Envie';
      break;
      
    case 'status_solicitacao':
      content = 'Para verificar status:\n\n• **Orçamentos**: Acesse **Orçamentos** → **Meus Orçamentos**\n• **OS**: Acesse **Ordens de Serviço**\n• **Pagamentos**: Acesse **Financeiro** → **Pagamentos**\n\nQual tipo de solicitação você quer acompanhar?';
      break;
      
    default:
      content = 'Desculpe, não consegui entender sua pergunta. Poderia reformular ou escolher uma das opções:\n\n• Dúvidas sobre serviços\n• Dúvidas sobre o sistema\n• Abrir um chamado\n• Verificar status';
  }
  
  // Se há contexto relevante, adicionar
  if (context) {
    content += '\n\n---\n📌 Informações adicionais da base de conhecimento disponíveis.';
  }
  
  return {
    success: true,
    content,
    provider: 'rule-based',
    model: 'fallback',
    latencyMs: Date.now() - startTime,
  };
}

// Obter estatísticas do agente
export function getAgentStats() {
  return {
    knowledgeBase: getKnowledgeBaseStats(),
    providers: getAIOrchestrator().getLogs(),
  };
}
