import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { checkAiAccess, setAiAccess, getAiAccessUsers } from '@/lib/ai/access';

// ==========================================
// API ENDPOINT - GESTÃO DE ACESSO IA
// GET  /api/ai/access - Listar usuários com status de acesso
// POST /api/ai/access - Ativar/desativar acesso
// ==========================================

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admin pode listar
    const userId = authResult.user?.id || authResult.user?.sub;
    if (userId) {
      const isAdmin = await checkAiAccess(userId);
      // Por enquanto, qualquer um com acesso pode listar (ajustar conforme RBAC)
    }

    const users = await getAiAccessUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[AI_ACCESS_LIST_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao listar acessos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // TODO: Verificar se o usuário é admin antes de alterar acesso de outros
    const body = await request.json();
    const { userId: targetUserId, enabled } = body;

    if (!targetUserId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'userId e enabled são obrigatórios' },
        { status: 400 }
      );
    }

    const success = await setAiAccess(targetUserId, enabled);
    if (!success) {
      return NextResponse.json({ error: 'Erro ao atualizar acesso' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Acesso IA ${enabled ? 'ativado' : 'desativado'} para o usuário`,
    });
  } catch (error) {
    console.error('[AI_ACCESS_SET_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao atualizar acesso' }, { status: 500 });
  }
}
