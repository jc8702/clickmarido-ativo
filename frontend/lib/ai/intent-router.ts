// ==========================================
// ROUTER DE INTENÇÃO
// Classifica mensagens do usuário em intenções
// ==========================================

export type Intent =
  | 'servico_eletrica'
  | 'servico_hidraulica'
  | 'servico_automacao_residencial'
  | 'servico_montagem_moveis'
  | 'sistema_uso_geral'
  | 'sistema_modulos'
  | 'suporte_tecnico'
  | 'abertura_chamado'
  | 'status_solicitacao'
  | 'humano'
  | 'desconhecido';

export interface IntentResult {
  primary: Intent;
  secondary?: Intent;
  confidence: number;
  needsClarification: boolean;
  needsEscalation: boolean;
  clarificationMessage?: string;
  escalationReason?: string;
}

// Keywords para cada intenção
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  servico_eletrica: [
    'elétrica', 'eletrica', 'eletricidade', 'tomada', 'interruptor',
    'disjuntor', 'quadro', 'fiação', 'fio', 'cabo', 'curto-circuito',
    'luz', 'iluminação', 'iluminacao', 'lâmpada', 'lampada', 'LED',
    'chuveiro', 'aquecedor', 'ar condicionado', 'ventilador',
    'instalação elétrica', 'instalacao eletrica', 'rede elétrica',
    'barramento', 'Aterramento', 'SPDA', 'nobreak', 'UPS',
  ],
  servico_hidraulica: [
    'hidráulica', 'hidraulica', 'encanamento', 'tubo', 'tubulação',
    'vazamento', 'goteira', 'torneira', 'registro', 'válvula',
    'chuveiro', 'lavatório', 'pia', 'tanque', 'vaso sanitário',
    'esgoto', 'descarga', 'caixa d\'água', 'bombas',
    'aquecedor a gás', 'coluna de água', 'água fria', 'água quente',
    'reparo hidráulico', 'instalação hidráulica',
  ],
  servico_automacao_residencial: [
    'automação', 'automacao', 'residencial', 'casa inteligente',
    'smart home', 'domótica', 'domotica', 'central',
    'portão', 'portao', 'eletrônico', 'eletronico', 'motor',
    'fechadura', 'cadeado', 'digital', 'biometria',
    'câmera', 'camera', 'segurança', 'seguranca', 'monitoramento',
    'alarme', 'sensores', 'sensor', 'presença', 'presenca',
    'iluminação automática', 'automação de iluminação',
    'Alexa', 'Google Home', 'integração', 'integracao',
  ],
  servico_montagem_moveis: [
    'móvel', 'movel', 'móveis', 'moveis', 'montagem',
    'desmontagem', 'desmontar', 'montar', 'armário', 'armario',
    'estante', 'prateleira', 'mesa', 'cadeira', 'sofá', 'sofa',
    'cama', 'roupeiro', 'gaveta', 'rack', 'painel',
    'IKEA', 'Madesa', 'Tok&Stok', 'Leroy',
    'parafuso', 'broca', 'ferramentas', 'serra',
  ],
  sistema_uso_geral: [
    'como usar', 'como funciona', 'funcionalidade', 'recurso',
    'tutorial', 'guia', 'ajuda', 'instrução', 'instrucao',
    'configuração', 'configuracao', 'preferências', 'preferencias',
    'perfil', 'conta', 'cadastro', 'senha', 'login',
    'navegação', 'navegacao', 'menu', 'tela', 'página', 'pagina',
  ],
  sistema_modulos: [
    'módulo', 'modulo', 'módulos', 'modulos', 'seção', 'secao',
    'cliente', 'clientes', 'orçamento', 'orcamento', 'orçamentos',
    'ordem de serviço', 'ordem de servico', 'OS', 'pagamento',
    'fatura', 'nota fiscal', 'despesa', 'estoque', 'compras',
    'fornecedor', 'relatório', 'relatorio', 'dashboard',
  ],
  suporte_tecnico: [
    'erro', 'bug', 'problema', 'não funciona', 'nao funciona',
    'travou', 'lento', 'lentidão', 'lentidao', 'crash',
    'falha', 'exception', 'timeout', 'carregando', 'carregamento',
    'atualizar', 'atualizacao', 'versão', 'versao', 'compatível',
    'compativel', 'requisitos', 'navegador',
  ],
  abertura_chamado: [
    'abrir chamado', 'abrir ticket', 'solicitar', 'atendimento',
    'suporte', 'ajuda', 'preciso de ajuda', 'falar com',
    'atendente', 'técnico', 'tecnico', 'especialista',
    'agendar', 'agendamento', 'visita', 'visita técnica',
  ],
  status_solicitacao: [
    'status', 'situação', 'situacao', 'andamento', 'acompanhar',
    'acompanhamento', 'onde está', 'onde esta', 'progresso',
    'previsão', 'previsao', 'quando', 'prazo', 'concluído',
    'concluido', 'pendente', 'em andamento',
  ],
  humano: [
    'falar com humano', 'falar com pessoa', 'atendente humano',
    'não quero bot', 'nao quero bot', 'pessoa real',
    'encaminhar', 'transferir', 'escalation',
  ],
  desconhecido: [],
};

// Palavras-chave de risco/escalonamento
const ESCALATION_KEYWORDS = [
  'urgente', 'emergência', 'emergencia', 'perigo', 'risco',
  'acidente', 'incêndio', 'incendio', 'curto', 'choque',
  'vazamento grave', 'inundação', 'inundacao', 'desabamento',
  'garantia', 'reclamação', 'reclamacao', 'insatisfeito',
  'processo', 'advogado', 'judicial', 'danos',
  'cobrança', 'cobranca', 'pagamento', 'divida', 'dívida',
  'não recebi', 'nao recebi', 'extraviado', 'extraviado',
  'orçamento', 'orcamento', 'preço', 'preco', 'valor',
];

// Normalizar texto
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calcular pontuação de intenção
function calculateIntentScore(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');
  let score = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    
    // Correspondência exata
    if (normalized.includes(normalizedKeyword)) {
      score += 10;
      continue;
    }

    // Correspondência por palavras
    const keywordWords = normalizedKeyword.split(' ');
    const matchingWords = keywordWords.filter(w => words.includes(w));
    score += (matchingWords.length / keywordWords.length) * 5;
  }

  return score;
}

// Verificar se há necessidade de escalação
function checkEscalation(text: string): { needed: boolean; reason?: string } {
  const normalized = normalizeText(text);

  for (const keyword of ESCALATION_KEYWORDS) {
    if (normalized.includes(normalizeText(keyword))) {
      return {
        needed: true,
        reason: `Palavra-chave de risco detectada: "${keyword}"`,
      };
    }
  }

  return { needed: false };
}

// Router principal
export function routeIntent(message: string, context?: string[]): IntentResult {
  const normalized = normalizeText(message);

  // 1. Verificar escalação primeiro
  const escalation = checkEscalation(message);
  if (escalation.needed) {
    return {
      primary: 'humano',
      confidence: 1.0,
      needsClarification: false,
      needsEscalation: true,
      escalationReason: escalation.reason,
    };
  }

  // 2. Verificar pedido explícito de humano
  const humanoScore = calculateIntentScore(message, INTENT_KEYWORDS.humano);
  if (humanoScore > 5) {
    return {
      primary: 'humano',
      confidence: 1.0,
      needsClarification: false,
      needsEscalation: false,
    };
  }

  // 3. Calcular pontuação para cada intenção
  const scores: Array<{ intent: Intent; score: number }> = [];

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'humano' || intent === 'desconhecido') continue;
    
    const score = calculateIntentScore(message, keywords);
    if (score > 0) {
      scores.push({ intent: intent as Intent, score });
    }
  }

  // Ordenar por pontuação
  scores.sort((a, b) => b.score - a.score);

  // 4. Determinar intenção principal
  if (scores.length === 0) {
    // Nenhuma intenção detectada
    return {
      primary: 'desconhecido',
      confidence: 0,
      needsClarification: true,
      needsEscalation: false,
      clarificationMessage: 'Não consegui entender sua pergunta. Poderia reformular ou escolher uma das opções abaixo?\n\n• Dúvidas sobre serviços (elétrica, hidráulica, automação, móveis)\n• Dúvidas sobre o sistema\n• Abrir um chamado\n• Verificar status de solicitação',
    };
  }

  const primary = scores[0];
  const secondary = scores.length > 1 ? scores[1] : undefined;

  // 5. Verificar se há múltiplas intenções fortes
  if (secondary && secondary.score > primary.score * 0.7) {
    // Intenções mistas - pedir esclarecimento
    return {
      primary: primary.intent,
      secondary: secondary.intent,
      confidence: primary.score / (primary.score + secondary.score),
      needsClarification: true,
      needsEscalation: false,
      clarificationMessage: `Parece que sua pergunta envolve dois assuntos: ${formatIntentName(primary.intent)} e ${formatIntentName(secondary.intent)}. Qual deles é mais importante para você agora?`,
    };
  }

  // 6. Verificar confiança baixa
  if (primary.score < 5) {
    return {
      primary: primary.intent,
      confidence: primary.score / 20,
      needsClarification: true,
      needsEscalation: false,
      clarificationMessage: 'Tenho certeza que entendi? Poderia me dar mais detalhes sobre sua pergunta?',
    };
  }

  return {
    primary: primary.intent,
    secondary: secondary?.intent,
    confidence: Math.min(primary.score / 15, 1),
    needsClarification: false,
    needsEscalation: false,
  };
}

// Formatar nome da intenção para exibição
function formatIntentName(intent: Intent): string {
  const names: Record<Intent, string> = {
    servico_eletrica: 'serviço de elétrica',
    servico_hidraulica: 'serviço de hidráulica',
    servico_automacao_residencial: 'automação residencial',
    servico_montagem_moveis: 'montagem de móveis',
    sistema_uso_geral: 'uso do sistema',
    sistema_modulos: 'módulos do sistema',
    suporte_tecnico: 'suporte técnico',
    abertura_chamado: 'abertura de chamado',
    status_solicitacao: 'status de solicitação',
    humano: 'atendimento humano',
    desconhecido: 'desconhecido',
  };
  return names[intent] || intent;
}

// Log de roteamento
export interface RouteLog {
  timestamp: Date;
  message: string;
  result: IntentResult;
  context?: string[];
}

const routeLogs: RouteLog[] = [];

export function logRoute(message: string, result: IntentResult, context?: string[]) {
  routeLogs.push({
    timestamp: new Date(),
    message: message.substring(0, 100),
    result,
    context,
  });

  // Manter apenas últimos 500 logs
  if (routeLogs.length > 500) {
    routeLogs.splice(0, routeLogs.length - 500);
  }
}

export function getRouteLogs() {
  return [...routeLogs];
}
