import { Intent, IntentResult } from './intent-router';

// ==========================================
// ESCALONAMENTO INTELIGENTE
// Centraliza lógica de quando escalar para humano
// ==========================================

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string;
  team?: string;
  priority: 'low' | 'medium' | 'high';
  nextAction: string;
}

// Palavras-chave de risco técnico (perigo físico)
const TECHNICAL_RISK_KEYWORDS = [
  'choque elétrico', 'choque', 'curto-circuito', 'incêndio', 'fumaça',
  'vazamento grave', 'inundação', 'desabamento', 'gás', 'explosão',
  'fiação viva', 'fio desencapado', 'arco elétrico',
];

// Palavras-chave de urgência operacional
const URGENCY_KEYWORDS = [
  'urgente', 'emergência', 'emergencia', 'imediato', 'agora',
  'não funciona', 'parou', 'travou', 'caiu', 'fora do ar',
];

// Palavras-chave de reclamação/jurídico
const COMPLAINT_KEYWORDS = [
  'reclamação', 'reclamacao', 'advogado', 'processo', 'judicial',
  'danos', 'prejuízo', 'prejuizo', 'cobrança indevida', 'golpe',
  'vou processar', 'direito do consumidor', 'Procon',
];

// Palavras-chave de orçamento/financeiro
const FINANCIAL_KEYWORDS = [
  'orçamento', 'orcamento', 'preço', 'preco', 'quanto custa',
  'valor', 'desconto', 'pagamento', 'boleto', 'nota fiscal',
  'garantia', 'reembolso', 'estorno',
];

function containsAny(text: string, keywords: string[]): string | null {
  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normalizedKeyword)) {
      return keyword;
    }
  }
  return null;
}

export function evaluateEscalation(
  message: string,
  intentResult: IntentResult
): EscalationResult {
  // 1. Risco técnico — sempre escalar com prioridade alta
  const technicalRisk = containsAny(message, TECHNICAL_RISK_KEYWORDS);
  if (technicalRisk) {
    return {
      shouldEscalate: true,
      reason: `Risco técnico detectado: "${technicalRisk}"`,
      team: 'tecnico',
      priority: 'high',
      nextAction: 'Conectar com técnico especializado imediatamente',
    };
  }

  // 2. Reclamação/jurídico — escalar com prioridade alta
  const complaint = containsAny(message, COMPLAINT_KEYWORDS);
  if (complaint) {
    return {
      shouldEscalate: true,
      reason: `Reclamação ou questão jurídica detectada: "${complaint}"`,
      team: 'gerencia',
      priority: 'high',
      nextAction: 'Encaminhar para gestão',
    };
  }

  // 3. Pedido explícito de humano
  if (intentResult.primary === 'humano') {
    return {
      shouldEscalate: true,
      reason: 'Usuário solicitou atendimento humano',
      team: 'suporte',
      priority: 'medium',
      nextAction: 'Conectar com atendente',
    };
  }

  // 4. Confiança muito baixa
  if (intentResult.confidence < 0.2) {
    return {
      shouldEscalate: true,
      reason: 'Confiança muito baixa na classificação da intenção',
      team: 'suporte',
      priority: 'medium',
      nextAction: 'Solicitar esclarecimento ou conectar com humano',
    };
  }

  // 5. Urgência operacional — escalar se já tiver其他 indicadores
  const urgency = containsAny(message, URGENCY_KEYWORDS);
  if (urgency && intentResult.confidence < 0.5) {
    return {
      shouldEscalate: true,
      reason: `Urgência detectada com confiança baixa: "${urgency}"`,
      team: 'suporte',
      priority: 'medium',
      nextAction: 'Priorizar atendimento',
    };
  }

  // 6. Financeiro com confiança baixa — melhor escalar
  const financial = containsAny(message, FINANCIAL_KEYWORDS);
  if (financial && intentResult.confidence < 0.4) {
    return {
      shouldEscalate: true,
      reason: `Questão financeira com confiança baixa: "${financial}"`,
      team: 'financeiro',
      priority: 'low',
      nextAction: 'Encaminhar para equipe financeira',
    };
  }

  // 7. Não escalonar
  return {
    shouldEscalate: false,
    reason: '',
    priority: 'low',
    nextAction: '',
  };
}
