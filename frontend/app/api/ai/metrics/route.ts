import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getMetrics, clearOldLogs } from '@/lib/ai/logs';

// ==========================================
// API ENDPOINT - MÉTRICAS DO ASSISTENTE IA
// GET /api/ai/metrics - Métricas agregadas
// DELETE /api/ai/metrics - Limpar logs antigos
// ==========================================

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const metrics = await getMetrics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[AI_METRICS_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const deleted = await clearOldLogs(days);

    return NextResponse.json({ deleted, days });
  } catch (error) {
    console.error('[AI_METRICS_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 });
  }
}
