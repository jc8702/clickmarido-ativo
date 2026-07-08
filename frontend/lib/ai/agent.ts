import { routeIntent, Intent, IntentResult, logRoute } from './intent-router';
import { buildContext, getKnowledgeBaseStats } from './rag-engine';
import { getAIOrchestrator } from './providers';
import { AIMessage, AIResponse } from './providers/types';
import { logChat } from './logs';
import { evaluateEscalation } from './escalation';
import { formatFunctionsForPrompt, executeFunction } from './functions';
import { loadConversation, saveMessage, formatHistoryForLLM } from './conversation-memory';

// ==========================================
// AGENTE PRINCIPAL DO CLICKMARIDO
// Orquestra roteamento, RAG e geração de resposta
// ==========================================

export interface ChatRequest {
  message: string;
  userId?: string;
  sessionId?: string;
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

Contexto disponível será fornecido entre marcadores [CONTEXTO]...[/CONTEXTO].

## Ferramentas Disponíveis

Você pode usar as seguintes ferramentas quando necessário:

${formatFunctionsForPrompt()}

Para usar uma ferramenta, responda EXATAMENTE neste formato:
[TOOL_CALL] nome_da_funcao(param1: "valor1", param2: "valor2")

Exemplo:
[TOOL_CALL] buscar_documentacao(modulo: "orçamentos")

IMPORTANTE: Use ferramentas APENAS quando necessário. Se o contexto já responde a pergunta, responda diretamente.`;

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
  const MAX_TOTAL_TIME = 12000; // 12s máximo total (Vercel timeout ~10s)
  
  // Função auxiliar com timeout global
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      ),
    ]);
  };
  
  // 1. Classificar intenção (rápido, sem timeout)
  const intentResult = routeIntent(request.message, 
    request.conversationHistory?.map(h => h.content)
  );
  
  logRoute(request.message, intentResult);
  
  // 2. Avaliar escalonamento inteligente
  const escalationResult = evaluateEscalation(request.message, intentResult);
  
  // 3. Verificar se precisa de escalação
  if (intentResult.needsEscalation || escalationResult.shouldEscalate) {
    const escalationReason = intentResult.escalationReason || escalationResult.reason;
    const response = await generateEscalationResponse(request, intentResult, escalationResult);
    
    // Log de escalonamento (fire-and-forget)
    logChat({
      userId: request.userId,
      sessionId: request.sessionId,
      message: request.message,
      intent: intentResult.primary,
      confidence: intentResult.confidence,
      provider: response.provider,
      model: response.model,
      tokensIn: response.tokensIn ?? response.tokensUsed ?? 0,
      tokensOut: response.tokensOut ?? 0,
      latencyMs: Date.now() - startTime,
      success: response.success,
      escalated: true,
    }).catch(console.error);
    
    return {
      success: true,
      content: response.content,
      intent: intentResult,
      provider: response.provider,
      model: response.model,
      needsEscalation: true,
      escalationReason,
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
    // Log de esclarecimento (fire-and-forget)
    logChat({
      userId: request.userId,
      sessionId: request.sessionId,
      message: request.message,
      intent: intentResult.primary,
      confidence: intentResult.confidence,
      provider: 'rule-based',
      model: 'none',
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - startTime,
      success: true,
      escalated: false,
    }).catch(console.error);
    
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
  
  // 5. Gerar resposta com IA (com timeout global)
  let response;
  const timeRemaining = MAX_TOTAL_TIME - (Date.now() - startTime);
  
  try {
    response = await withTimeout(
      generateAIResponse(request, intentResult, context),
      Math.min(timeRemaining, 10000) // máximo 10s para IA
    );
  } catch (err) {
    // Timeout ou erro → usar fallback regras
    console.warn('[AI_TIMEOUT] Gerando resposta baseada em regras');
    response = generateRuleBasedResponse(request, intentResult, context);
  }
  
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

  // 6. Registrar log (fire-and-forget, não bloqueia resposta)
  logChat({
    userId: request.userId,
    sessionId: request.sessionId,
    message: request.message,
    intent: intentResult.primary,
    confidence: intentResult.confidence,
    provider: response.provider,
    model: response.model,
    tokensIn: response.tokensIn ?? response.tokensUsed ?? 0,
    tokensOut: response.tokensOut ?? 0,
    latencyMs: finalResponse.latencyMs,
    success: response.success,
    escalated: false,
  }).catch(console.error);

  // Salvar na memória da conversa (fire-and-forget)
  if (request.sessionId) {
    saveMessage(request.sessionId, request.userId, 'user', request.message).catch(console.error);
    saveMessage(request.sessionId, request.userId, 'assistant', response.content).catch(console.error);
  }

  return finalResponse;
}

// Gerar resposta de escalação
async function generateEscalationResponse(
  request: ChatRequest,
  intentResult: IntentResult,
  escalationResult?: { reason: string; team?: string; priority: string; nextAction: string }
): Promise<AIResponse> {
  const orchestrator = getAIOrchestrator();
  
  // Construir prompt de escalação com contexto
  let escalationPrompt = ESCALATION_PROMPT;
  if (escalationResult) {
    escalationPrompt += `\n\nDetalhes do escalonamento:
- Motivo: ${escalationResult.reason}
- Equipe: ${escalationResult.team || 'suporte'}
- Prioridade: ${escalationResult.priority}
- Próxima ação: ${escalationResult.nextAction}`;
  }
  
  const messages: AIMessage[] = [
    { role: 'system', content: escalationPrompt },
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
  
  // Carregar histórico da conversa (se houver sessionId)
  if (request.sessionId) {
    const history = await loadConversation(request.sessionId);
    if (history.length > 0) {
      const formattedHistory = formatHistoryForLLM(history, 10);
      for (const msg of formattedHistory) {
        messages.push(msg);
      }
    }
  } else if (request.conversationHistory && request.conversationHistory.length > 0) {
    // Fallback: usar histórico passado diretamente
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
  
  // Verificar se a resposta contém tool call
  const toolCallMatch = response.content.match(/\[TOOL_CALL\]\s*(\w+)\(([^)]+)\)/);
  if (toolCallMatch) {
    const functionName = toolCallMatch[1];
    const paramsStr = toolCallMatch[2];
    
    // Parse dos parâmetros
    const params: Record<string, string> = {};
    const paramPairs = paramsStr.split(',').map(p => p.trim());
    for (const pair of paramPairs) {
      const [key, value] = pair.split(':').map(s => s.trim().replace(/"/g, ''));
      if (key && value) {
        params[key] = value;
      }
    }
    
    // Executar função
    const functionResult = await executeFunction(functionName, params, request.userId, request.sessionId);
    
    if (functionResult.success) {
      // Gerar resposta com base no resultado da função
      const followUpMessages: AIMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: request.message },
        { role: 'assistant', content: response.content },
        { role: 'user', content: `Resultado da ferramenta "${functionName}":\n${JSON.stringify(functionResult.result, null, 2)}\n\nAgora responda ao usuário com base nesse resultado.` },
      ];
      
      const followUpResponse = await orchestrator.generate({
        messages: followUpMessages,
        temperature: 0.7,
        maxTokens: 1024,
      });
      
      if (followUpResponse.success) {
        return {
          ...followUpResponse,
          content: followUpResponse.content,
        };
      }
      
      // Se a geração de follow-up falhar, usar resposta estática
      return {
        success: true,
        content: formatFunctionResult(functionName, functionResult.result),
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
      };
    }
  }
  
  return response;
}

// Formatar resultado de função para resposta estática
function formatFunctionResult(functionName: string, result: any): string {
  switch (functionName) {
    case 'buscar_documentacao':
      if (result.found && result.documents?.length > 0) {
        const docs = result.documents.map((d: any) => `**${d.title}** (${d.category})`).join('\n• ');
        return `Encontrei documentação relacionada:\n• ${docs}\n\nPosso ajudar com mais alguma dúvida?`;
      }
      return result.message || 'Não encontrei documentação específica para essa busca.';
    
    case 'registrar_lacuna_conhecimento':
      return 'Sua pergunta foi registrada para melhoria da base de conhecimento. Um especialista irá analisar em breve.';
    
    case 'estimar_preco_servico':
      if (result.suggestedPrice) {
        let response = `**Estimativa de Preço**\n\n`;
        response += `• Valor sugerido: **R$ ${result.suggestedPrice.toFixed(2)}**\n`;
        response += `• Faixa: R$ ${result.minPrice.toFixed(2)} - R$ ${result.maxPrice.toFixed(2)}\n`;
        response += `• Base: ${result.basis === 'historical' ? `${result.sampleSize} orçamentos anteriores` : 'taxa hora padrão'}\n`;
        if (result.notes?.length > 0) {
          response += `• Ajustes: ${result.notes.join(', ')}\n`;
        }
        response += `\n_${result.disclaimer}_`;
        return response;
      }
      return 'Não foi possível gerar estimativa para esse serviço.';
    
    default:
      return 'Ação executada com sucesso.';
  }
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
      content = `**Serviços de Elétrica** 🔌

Posso ajudar com:
• **Instalação elétrica** completa (residencial e comercial)
• **Quadro de força** / Painel elétrico
• **Disjuntores** e barramento
• **Tomadas** e interruptores
• **Iluminação** (LED,spots, lustres)
• **Fiação** e cabeamento
• **Chuveiro** e aquecedor
• **Ar condicionado** (instalação)
• **Nobreak** e UPS
• **Aterramento** e SPDA

**Para orçamento:**
Acesse **Orçamentos** → **Novo Orçamento** e selecione "Elétrica".

**Emergência?** Ligue para um eletricista habilitado imediatamente.`;
      break;
      
    case 'servico_hidraulica':
      content = `**Serviços de Hidráulica** 🔧

Posso ajudar com:
• **Reparo de vazamentos** (torneiras, registros, tubulações)
• **Substituição** de torneiras e registros
• **Desentupimento** (pia, vaso, ralo)
• **Manutenção** em caixas d'água
• **Instalação hidráulica** completa
• **Aquecedor a gás** (instalação e reparo)
• **Coluna de água**
• **Água fria e quente**
• **Esgoto** e descarga

**Para orçamento:**
Acesse **Orçamentos** → **Novo Orçamento** e selecione "Hidráulica".

**Vazamento grave?** Feche o registro principal e acione um técnico.`;
      break;
      
    case 'servico_automacao_residencial':
      content = `**Automação Residencial** 🏠

Posso ajudar com:
• **Portões eletrônicos** (motor, controle, instalação)
• **Fechaduras digitais** e biometria
• **Câmeras de segurança** e monitoramento
• **Alarmes** e sensores de presença
• **Iluminação automática**
• **Integração** com Alexa, Google Home
• **Domótica** completa

**Para orçamento:**
Acesse **Orçamentos** → **Novo Orçamento** e selecione "Automação".`;
      break;
      
    case 'servico_montagem_moveis':
      content = `**Montagem de Móveis** 🪑

Posso ajudar com:
• **Montagem** de armários, estantes, mesas, cadeiras
• **Desmontagem** para mudança
• **Reparo** em gavetas e portas
• **Fixação** em paredes (prateleiras, quadros)
• Móveis de **IKEA, Madesa, Tok&Stok, Leroy**

**Para orçamento:**
Acesse **Orçamentos** → **Novo Orçamento** e selecione "Montagem".`;
      break;
      
    case 'sistema_uso_geral':
      content = `**Como usar o ClickMarido** 💻

Posso ajudar com:
• **Navegação** no sistema
• **Cadastro** de clientes e fornecedores
• **Criação** de orçamentos e propostas
• **Gestão** de ordens de serviço (OS)
• **Pagamentos** e cobranças
• **Relatórios** e indicadores
• **Configurações** da conta

**Qual funcionalidade específica você quer saber?**`;
      break;
      
    case 'sistema_modulos':
      content = `**Módulos do ClickMarido** 📋

• **Dashboard** - Visão geral do negócio
• **Clientes** - Cadastro e gestão
• **Orçamentos** - Propostas comerciais
• **Ordens de Serviço** - Execução dos serviços
• **Pagamentos** - Cobranças e recebimentos
• **Financeiro** - Fluxo de caixa
• **Relatórios** - Análises e indicadores
• **Configurações** - Preferências do sistema

**Qual módulo você quer usar?**`;
      break;
      
    case 'suporte_tecnico':
      content = `**Suporte Técnico** 🛠️

Para resolver seu problema:
1. **Descreva** o problema detalhadamente
2. **Tire um print** da tela com o erro
3. **Anote** os passos que deu antes do problema
4. **Abra um chamado** em **Suporte** → **Novo Chamado**

**Problemas comuns:**
• Sistema lento → Limpe o cache do navegador
• Erro de login → Verifique email e senha
• Dados não salvam → Verifique sua conexão`;
      break;
      
    case 'abertura_chamado':
      content = `**Abrir Chamado** 📩

1. Acesse **Suporte** → **Novo Chamado**
2. Selecione a **categoria** (Técnico, Financeiro, Dúvida)
3. **Descreva** o problema ou solicitação
4. **Anexe** prints se necessário
5. **Envie**

Responderemos o mais breve possível!`;
      break;
      
    case 'status_solicitacao':
      content = `**Acompanhar Solicitações** 📊

• **Orçamentos**: Acesse **Orçamentos** → **Meus Orçamentos**
• **Ordens de Serviço**: Acesse **Ordens de Serviço**
• **Pagamentos**: Acesse **Financeiro** → **Pagamentos**
• **Chamados**: Acesse **Suporte** → **Meus Chamados**

**Qual tipo de solicitação você quer acompanhar?**`;
      break;
      
    default:
      content = `Não consegui identificar sua pergunta. Posso ajudar com:

🔧 **Serviços**: Elétrica, Hidráulica, Automação, Móveis
💻 **Sistema**: Como usar, módulos, configurações
📩 **Suporte**: Abrir chamado, verificar status

**Digite sua pergunta ou escolha uma opção acima.**`;
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
