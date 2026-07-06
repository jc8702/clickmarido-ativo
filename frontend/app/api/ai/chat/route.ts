import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { processMessage, ChatRequest } from '@/lib/ai/agent';

// ==========================================
// API ENDPOINT - CHAT COM IA
// POST /api/ai/chat
// ==========================================

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validar autenticação
    const authResult = await verifyAuth(request);
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

    // 4. Processar mensagem
    const chatRequest: ChatRequest = {
      message: message.trim(),
      userId: authResult.user?.id || authResult.user?.sub,
      conversationHistory: conversationHistory || [],
    };

    const response = await processMessage(chatRequest);

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
