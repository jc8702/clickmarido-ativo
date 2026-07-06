import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { processMessage, ChatRequest } from '@/lib/ai/agent';
import { routeIntent } from '@/lib/ai/intent-router';

// ==========================================
// API ENDPOINT - CHAT COM IA
// POST /api/ai/chat
// ==========================================

export async function POST(request: NextRequest): Promise<Response> {
  const MAX_API_TIME = 15000; // 15s máximo para toda a requisição
  
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: API demorou demais')), ms)
      ),
    ]);
  };

  try {
    // 1. Validar autenticação
    const authResult = await withTimeout(verifyAuth(request), 5000);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // 2. Extrair dados da requisição
    const body = await request.json();
    const { message, conversationHistory } = body;

    // 3. Validar mensagem
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Mensagem muito longa (máximo 2000 caracteres)' },
        { status: 400 }
      );
    }

    // 4. Processar mensagem (com timeout)
    const chatRequest: ChatRequest = {
      message: message.trim(),
      userId: authResult.user?.id || authResult.user?.sub,
      conversationHistory: conversationHistory || [],
    };

    let response;
    try {
      response = await withTimeout(processMessage(chatRequest), MAX_API_TIME);
    } catch (err) {
      // Timeout ou erro → resposta fallback imediata
      console.warn('[AI_API_TIMEOUT]', err);
      return NextResponse.json({
        success: true,
        content: getFallbackResponse(message.trim()),
        intent: 'desconhecido',
        needsEscalation: false,
        clarificationNeeded: false,
        provider: 'fallback-timeout',
        model: 'static',
        latencyMs: 0,
      });
    }

    // 5. Registrar log (opcional)
    console.log('[CHAT_REQUEST]', {
      userId: authResult.user?.id || authResult.user?.sub,
      message: message.substring(0, 100),
      intent: response.intent.primary,
      provider: response.provider,
      success: response.success,
      latencyMs: response.latencyMs,
    });

    // 6. Retornar resposta
    return NextResponse.json({
      success: response.success,
      content: response.content,
      intent: response.intent.primary,
      needsEscalation: response.needsEscalation,
      escalationReason: response.escalationReason,
      clarificationNeeded: response.clarificationNeeded,
      clarificationMessage: response.clarificationMessage,
      provider: response.provider,
      model: response.model,
      latencyMs: response.latencyMs,
    });

  } catch (error) {
    console.error('[API_CHAT_ERROR]', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar mensagem',
        success: false,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou abra um chamado técnico.',
      },
      { status: 500 }
    );
  }
}

// Rate limiting básico
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minuto
    return true;
  }

  if (limit.count >= 30) { // 30 mensagens por minuto
    return false;
  }

  limit.count++;
  return true;
}

// GET para verificar status do chat
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Retornar informações sobre o chat
    return NextResponse.json({
      status: 'online',
      capabilities: [
        'Dúvidas sobre serviços (Elétrica, Hidráulica, Automação, Móveis)',
        'Dúvidas sobre o sistema',
        'Abertura de chamados',
        'Verificação de status',
      ],
      limitations: [
        'Não pode alterar dados do sistema',
        'Não pode processar pagamentos',
        'Escala para humano quando necessário',
      ],
    });

  } catch (error) {
    console.error('[API_CHAT_STATUS_ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    );
  }
}

// Resposta fallback rápida (quando IA falha ou timeout)
function getFallbackResponse(message: string): string {
  const intent = routeIntent(message);
  
  const fallbacks: Record<string, string> = {
    servico_eletrica: `**Serviços de Elétrica** 🔌

Posso ajudar com:
• Instalação elétrica completa
• Quadro de força / Painel elétrico
• Disjuntores e barramento
• Tomadas e interruptores
• Iluminação (LED, spots, lustres)
• Fiação e cabeamento
• Chuveiro e aquecedor
• Ar condicionado
• Nobreak e UPS
• Aterramento e SPDA

**Para orçamento:** Acesse **Orçamentos** → **Novo Orçamento** e selecione "Elétrica".`,

    servico_hidraulica: `**Serviços de Hidráulica** 🔧

Posso ajudar com:
• Reparo de vazamentos
• Substituição de torneiras
• Desentupimento
• Manutenção em caixas d'água
• Instalação hidráulica completa
• Aquecedor a gás
• Coluna de água
• Água fria e quente
• Esgoto e descarga

**Para orçamento:** Acesse **Orçamentos** → **Novo Orçamento** e selecione "Hidráulica".`,

    servico_automacao_residencial: `**Automação Residencial** 🏠

Posso ajudar com:
• Portões eletrônicos
• Fechaduras digitais e biometria
• Câmeras de segurança
• Alarmes e sensores
• Iluminação automática
• Integração com Alexa/Google
• Domótica completa

**Para orçamento:** Acesse **Orçamentos** → **Novo Orçamento** e selecione "Automação".`,

    servico_montagem_moveis: `**Montagem de Móveis** 🪑

Posso ajudar com:
• Montagem de armários, estantes, mesas
• Desmontagem para mudança
• Reparo em gavetas e portas
• Fixação em paredes

**Para orçamento:** Acesse **Orçamentos** → **Novo Orçamento** e selecione "Montagem".`,

    sistema_uso_geral: `**Como usar o ClickMarido** 💻

Posso ajudar com:
• Navegação no sistema
• Cadastro de clientes
• Criação de orçamentos
• Gestão de ordens de serviço
• Pagamentos e cobranças
• Relatórios e indicadores

**Qual funcionalidade específica você quer saber?**`,

    sistema_modulos: `**Módulos do ClickMarido** 📋

• **Dashboard** - Visão geral
• **Clientes** - Cadastro e gestão
• **Orçamentos** - Propostas
• **Ordens de Serviço** - Execução
• **Pagamentos** - Cobranças
• **Financeiro** - Fluxo de caixa
• **Relatórios** - Análises

**Qual módulo você quer usar?**`,

    suporte_tecnico: `**Suporte Técnico** 🛠️

1. Descreva o problema detalhadamente
2. Tire um print da tela com o erro
3. Anote os passos que deu
4. Abra um chamado em **Suporte** → **Novo Chamado**`,

    abertura_chamado: `**Abrir Chamado** 📩

1. Acesse **Suporte** → **Novo Chamado**
2. Selecione a categoria
3. Descreva o problema
4. Anexe prints se necessário
5. Envie`,

    status_solicitacao: `**Acompanhar Solicitações** 📊

• **Orçamentos**: **Orçamentos** → **Meus Orçamentos**
• **OS**: **Ordens de Serviço**
• **Pagamentos**: **Financeiro** → **Pagamentos**

**Qual tipo de solicitação você quer acompanhar?**`,
  };

  return fallbacks[intent.primary] || `Não consegui identificar sua pergunta. Posso ajudar com:

🔧 **Serviços**: Elétrica, Hidráulica, Automação, Móveis
💻 **Sistema**: Como usar, módulos, configurações
📩 **Suporte**: Abrir chamado, verificar status

**Digite sua pergunta ou escolha uma opção acima.**`;
}
