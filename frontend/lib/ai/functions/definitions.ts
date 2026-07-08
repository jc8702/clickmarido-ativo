// ==========================================
// DEFINIÇÕES DE FUNCTIONS (TOOLS)
// Tools disponíveis para o assistente IA
// ==========================================

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export const AI_FUNCTIONS: FunctionDefinition[] = [
  {
    name: 'buscar_documentacao',
    description: 'Busca documentação específica de um módulo ou funcionalidade do sistema ClickMarido. Use quando o usuário perguntar sobre como usar algo específico.',
    parameters: {
      type: 'object',
      properties: {
        modulo: {
          type: 'string',
          description: 'Nome do módulo ou funcionalidade (ex: orçamentos, ordens de serviço, clientes, pagamentos)',
        },
      },
      required: ['modulo'],
    },
  },
  {
    name: 'registrar_lacuna_conhecimento',
    description: 'Registra quando o assistente não consegue responder uma pergunta com confiança suficiente. Use quando o contexto recuperado for insuficiente.',
    parameters: {
      type: 'object',
      properties: {
        pergunta: {
          type: 'string',
          description: 'A pergunta original do usuário que não pôde ser respondida',
        },
        domain: {
          type: 'string',
          description: 'Domínio da pergunta',
          enum: ['SERVICOS', 'SISTEMA', 'OPERACIONAL'],
        },
        motivo: {
          type: 'string',
          description: 'Breve descrição de por que não foi possível responder',
        },
      },
      required: ['pergunta', 'domain'],
    },
  },
  {
    name: 'estimar_preco_servico',
    description: 'Estima o preço de um serviço técnico com base no histórico de orçamentos anteriores. Use quando o usuário perguntar "quanto custa" ou pedir estimativa.',
    parameters: {
      type: 'object',
      properties: {
        categoria: {
          type: 'string',
          description: 'Categoria do serviço',
          enum: ['eletrica', 'hidraulica', 'automacao', 'montagem_moveis'],
        },
        descricao: {
          type: 'string',
          description: 'Descrição breve do serviço desejado',
        },
        tempo_estimado_minutos: {
          type: 'string',
          description: 'Tempo estimado em minutos (se conhecido)',
        },
      },
      required: ['categoria', 'descricao'],
    },
  },
];

// Formatar funções para o prompt do LLM
export function formatFunctionsForPrompt(): string {
  return AI_FUNCTIONS.map(fn => {
    const params = Object.entries(fn.parameters.properties)
      .map(([name, prop]) => `- ${name}: ${prop.description}`)
      .join('\n');
    return `### ${fn.name}\n${fn.description}\nParâmetros:\n${params}`;
  }).join('\n\n');
}

// Obter definição de uma função pelo nome
export function getFunctionDefinition(name: string): FunctionDefinition | undefined {
  return AI_FUNCTIONS.find(fn => fn.name === name);
}
