// ==========================================
// SISTEMA DE LOGS E OBSERVABILIDADE
// Registra todas as interações do chat
// ==========================================

export interface ChatLog {
  id: string;
  timestamp: Date;
  userId?: string;
  message: string;
  intent: string;
  provider: string;
  model: string;
  success: boolean;
  latencyMs: number;
  needsEscalation: boolean;
  escalationReason?: string;
  error?: string;
}

// Armazenamento em memória (produção usar banco)
const logs: ChatLog[] = [];
const MAX_LOGS = 10000;

// Gerar ID único
function generateId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Registrar log
export function logChat(params: {
  userId?: string;
  message: string;
  intent: string;
  provider: string;
  model: string;
  success: boolean;
  latencyMs: number;
  needsEscalation: boolean;
  escalationReason?: string;
  error?: string;
}): ChatLog {
  const log: ChatLog = {
    id: generateId(),
    timestamp: new Date(),
    ...params,
  };

  logs.push(log);

  // Manter apenas últimos MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  // Log no console para debug
  console.log('[CHAT_LOG]', {
    intent: log.intent,
    provider: log.provider,
    success: log.success,
    latency: `${log.latencyMs}ms`,
    escalation: log.needsEscalation,
  });

  return log;
}

// Obter logs
export function getLogs(params?: {
  userId?: string;
  intent?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): ChatLog[] {
  let filtered = [...logs];

  if (params?.userId) {
    filtered = filtered.filter((l) => l.userId === params.userId);
  }

  if (params?.intent) {
    filtered = filtered.filter((l) => l.intent === params.intent);
  }

  if (params?.startDate) {
    filtered = filtered.filter((l) => l.timestamp >= params.startDate!);
  }

  if (params?.endDate) {
    filtered = filtered.filter((l) => l.timestamp <= params.endDate!);
  }

  // Ordenar por timestamp (mais recente primeiro)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (params?.limit) {
    filtered = filtered.slice(0, params.limit);
  }

  return filtered;
}

// Estatísticas
export function getStats(params?: { startDate?: Date; endDate?: Date }) {
  let filtered = [...logs];

  if (params?.startDate) {
    filtered = filtered.filter((l) => l.timestamp >= params.startDate!);
  }

  if (params?.endDate) {
    filtered = filtered.filter((l) => l.timestamp <= params.endDate!);
  }

  const total = filtered.length;
  const successful = filtered.filter((l) => l.success).length;
  const escalations = filtered.filter((l) => l.needsEscalation).length;
  const avgLatency = total > 0
    ? filtered.reduce((sum, l) => sum + l.latencyMs, 0) / total
    : 0;

  // Contagem por intenção
  const byIntent: Record<string, number> = {};
  for (const log of filtered) {
    byIntent[log.intent] = (byIntent[log.intent] || 0) + 1;
  }

  // Contagem por provider
  const byProvider: Record<string, number> = {};
  for (const log of filtered) {
    byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
  }

  return {
    total,
    successful,
    failed: total - successful,
    escalations,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    escalationRate: total > 0 ? (escalations / total) * 100 : 0,
    avgLatencyMs: Math.round(avgLatency),
    byIntent,
    byProvider,
  };
}

// Limpar logs antigos
export function clearOldLogs(daysToKeep: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const initialLength = logs.length;
  const filtered = logs.filter((l) => l.timestamp >= cutoff);
  
  logs.length = 0;
  logs.push(...filtered);

  console.log(`[LOG_CLEANUP] Removidos ${initialLength - logs.length} logs antigos`);
}

// Exportar logs para análise
export function exportLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV
  const headers = 'id,timestamp,userId,message,intent,provider,model,success,latencyMs,needsEscalation,error\n';
  const rows = logs.map((l) => 
    `"${l.id}","${l.timestamp.toISOString()}","${l.userId || ''}","${l.message.substring(0, 100).replace(/"/g, '""')}","${l.intent}","${l.provider}","${l.model}",${l.success},${l.latencyMs},${l.needsEscalation},"${l.error || ''}"`
  ).join('\n');

  return headers + rows;
}
