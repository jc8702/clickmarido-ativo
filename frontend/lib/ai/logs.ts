import { prisma } from '../prisma';

// ==========================================
// SISTEMA DE LOGS E OBSERVABILIDADE
// Registra todas as interações do chat no banco
// ==========================================

// Tabela de preços por modelo (USD por 1M tokens)
// Atualizar conforme necessário: https://openrouter.ai/models
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openrouter/free': { input: 0, output: 0 },
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
  'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
  'google/gemini-2.0-flash-exp:free': { input: 0, output: 0 },
  'kilo-auto/free': { input: 0, output: 0 },
};

export interface LogParams {
  userId?: string;
  sessionId?: string;
  message: string;
  intent: string;
  confidence?: number;
  provider: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
  success: boolean;
  escalated?: boolean;
  escalationReason?: string;
  error?: string;
}

// Calcular custo estimado baseado no modelo
function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return ((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1_000_000;
}

// Registrar log no banco (async, não bloqueia)
export async function logChat(params: LogParams): Promise<void> {
  try {
    const cost = estimateCost(
      params.model,
      params.tokensIn ?? 0,
      params.tokensOut ?? 0
    );

    await prisma.aiConversationLog.create({
      data: {
        userId: params.userId || null,
        sessionId: params.sessionId || null,
        message: params.message.substring(0, 2000),
        intent: params.intent,
        confidence: params.confidence ?? 0,
        provider: params.provider,
        model: params.model,
        tokensIn: params.tokensIn ?? 0,
        tokensOut: params.tokensOut ?? 0,
        cost,
        latencyMs: params.latencyMs,
        success: params.success,
        escalated: params.escalated ?? false,
        escalationReason: params.escalationReason || null,
      },
    });

    console.log('[CHAT_LOG]', {
      intent: params.intent,
      provider: params.provider,
      model: params.model,
      tokens: `${params.tokensIn ?? 0}in/${params.tokensOut ?? 0}out`,
      cost: `$${cost.toFixed(6)}`,
      latency: `${params.latencyMs}ms`,
      success: params.success,
    });
  } catch (error) {
    // Log falha no banco não deve derrubar o fluxo principal
    console.error('[CHAT_LOG_ERROR]', error);
  }
}

// Obter logs com filtros
export async function getLogs(params?: {
  userId?: string;
  intent?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (params?.userId) where.userId = params.userId;
  if (params?.intent) where.intent = params.intent;
  if (params?.provider) where.provider = params.provider;
  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.aiConversationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      select: {
        id: true,
        userId: true,
        sessionId: true,
        message: true,
        intent: true,
        confidence: true,
        provider: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        cost: true,
        latencyMs: true,
        success: true,
        escalated: true,
        escalationReason: true,
        createdAt: true,
      },
    }),
    prisma.aiConversationLog.count({ where }),
  ]);

  return { logs, total };
}

// Métricas agregadas para dashboard
export async function getMetrics(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const [
    total,
    successful,
    escalated,
    tokensAgg,
    costAgg,
    latencyAgg,
    byIntent,
    byProvider,
    dailyTokens,
  ] = await Promise.all([
    prisma.aiConversationLog.count({ where }),
    prisma.aiConversationLog.count({ where: { ...where, success: true } }),
    prisma.aiConversationLog.count({ where: { ...where, escalated: true } }),
    prisma.aiConversationLog.aggregate({
      where,
      _sum: { tokensIn: true, tokensOut: true },
    }),
    prisma.aiConversationLog.aggregate({
      where,
      _sum: { cost: true },
    }),
    prisma.aiConversationLog.aggregate({
      where,
      _avg: { latencyMs: true },
    }),
    prisma.aiConversationLog.groupBy({
      by: ['intent'],
      where,
      _count: true,
      orderBy: { _count: { intent: 'desc' } },
    }),
    prisma.aiConversationLog.groupBy({
      by: ['provider'],
      where,
      _count: true,
      orderBy: { _count: { provider: 'desc' } },
    }),
    // Tokens por dia (últimos 30 dias)
    prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(tokens_in) as "tokensIn",
        SUM(tokens_out) as "tokensOut",
        SUM(cost) as cost,
        COUNT(*) as count
      FROM ai_conversation_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  ]);

  return {
    total,
    successful,
    failed: total - successful,
    escalated,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    escalationRate: total > 0 ? (escalated / total) * 100 : 0,
    totalTokensIn: Number(tokensAgg._sum.tokensIn ?? 0),
    totalTokensOut: Number(tokensAgg._sum.tokensOut ?? 0),
    totalCost: Number(costAgg._sum.cost ?? 0),
    avgLatencyMs: Math.round(Number(latencyAgg._avg.latencyMs ?? 0)),
    byIntent: byIntent.map((i) => ({ intent: i.intent, count: i._count })),
    byProvider: byProvider.map((p) => ({ provider: p.provider, count: p._count })),
    dailyTokens,
  };
}

// Limpar logs antigos
export async function clearOldLogs(daysToKeep: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.aiConversationLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`[LOG_CLEANUP] Removidos ${result.count} logs antigos`);
  return result.count;
}

// Exportar logs para análise
export async function exportLogs(params?: {
  startDate?: Date;
  endDate?: Date;
  format?: 'json' | 'csv';
}): Promise<string> {
  const where: any = {};
  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const logs = await prisma.aiConversationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });

  if (params?.format === 'csv') {
    const headers = 'id,timestamp,userId,message,intent,confidence,provider,model,tokensIn,tokensOut,cost,latencyMs,success,escalated\n';
    const rows = logs.map((l) =>
      `"${l.id}","${l.createdAt.toISOString()}","${l.userId || ''}","${l.message.substring(0, 100).replace(/"/g, '""')}","${l.intent}",${l.confidence},"${l.provider}","${l.model}",${l.tokensIn},${l.tokensOut},${l.cost},${l.latencyMs},${l.success},${l.escalated}`
    ).join('\n');
    return headers + rows;
  }

  return JSON.stringify(logs, null, 2);
}
