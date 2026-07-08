import { prisma } from '../../prisma';
import { getFunctionDefinition } from './definitions';
import { estimateServicePrice } from '../pricing-engine';

// ==========================================
// FUNCTION CALLER
// Executa as ações internas do assistente
// ==========================================

export interface FunctionCallResult {
  success: boolean;
  functionName: string;
  result: any;
  error?: string;
  latencyMs: number;
}

// Executar uma function call
export async function executeFunction(
  functionName: string,
  params: Record<string, any>,
  userId?: string,
  sessionId?: string
): Promise<FunctionCallResult> {
  const startTime = Date.now();
  
  try {
    let result: any;

    switch (functionName) {
      case 'buscar_documentacao':
        result = await buscarDocumentacao(params.modulo);
        break;
      
      case 'registrar_lacuna_conhecimento':
        result = await registrarLacuna(params.pergunta, params.domain, params.motivo, userId);
        break;
      
      case 'estimar_preco_servico':
        result = await estimarPreco(params.categoria, params.descricao, params.tempo_estimado_minutos);
        break;
      
      default:
        return {
          success: false,
          functionName,
          result: null,
          error: `Função desconhecida: ${functionName}`,
          latencyMs: Date.now() - startTime,
        };
    }

    // Registrar chamada no banco (fire-and-forget)
    if (userId) {
      prisma.aiFunctionCall.create({
        data: {
          userId,
          sessionId: sessionId || null,
          function: functionName,
          params,
          result,
          success: true,
          latencyMs: Date.now() - startTime,
        },
      }).catch(console.error);
    }

    return {
      success: true,
      functionName,
      result,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Registrar falha no banco
    if (userId) {
      prisma.aiFunctionCall.create({
        data: {
          userId,
          sessionId: sessionId || null,
          function: functionName,
          params,
          success: false,
          error: errorMessage,
          latencyMs: Date.now() - startTime,
        },
      }).catch(console.error);
    }

    return {
      success: false,
      functionName,
      result: null,
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ==========================================
// IMPLEMENTAÇÃO DAS FUNÇÕES
// ==========================================

// Buscar documentação de um módulo
async function buscarDocumentacao(modulo: string): Promise<any> {
  // Buscar na base de conhecimento (arquivos .md)
  const fs = require('fs');
  const path = require('path');
  
  const basePath = path.join(process.cwd(), 'lib', 'ai', 'knowledge-base');
  const results: Array<{ title: string; content: string; category: string }> = [];
  
  // Buscar em todas as categorias
  const categories = ['system', 'services', 'operations', 'faq'];
  
  for (const category of categories) {
    const categoryPath = path.join(basePath, category);
    if (!fs.existsSync(categoryPath)) continue;
    
    const files = fs.readdirSync(categoryPath).filter((f: string) => f.endsWith('.md'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(categoryPath, file), 'utf-8');
      const normalizedModule = modulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedContent = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      if (normalizedContent.includes(normalizedModule) || file.toLowerCase().includes(normalizedModule)) {
        results.push({
          title: content.match(/^#\s+(.+)$/m)?.[1] || file.replace('.md', ''),
          content: content.substring(0, 1500),
          category,
        });
      }
    }
  }
  
  return {
    found: results.length > 0,
    documents: results.slice(0, 3),
    message: results.length > 0
      ? `Encontrei ${results.length} documento(s) relacionado(s) a "${modulo}".`
      : `Não encontrei documentação específica para "${modulo}". Posso ajudar com dúvidas gerais sobre o sistema.`,
  };
}

// Registrar lacuna de conhecimento
async function registrarLacuna(
  pergunta: string,
  domain: string,
  motivo?: string,
  userId?: string
): Promise<any> {
  const gap = await prisma.aiKnowledgeGap.create({
    data: {
      question: pergunta,
      domain: domain || 'SISTEMA',
      intent: null,
      notes: motivo || null,
    },
  });
  
  return {
    registered: true,
    gapId: gap.id,
    message: 'Sua pergunta foi registrada para melhoria da base de conhecimento.',
  };
}

// Estimar preço de serviço (usa pricing-engine compartilhado)
async function estimarPreco(
  categoria: string,
  descricao: string,
  tempoEstimadoMinutos?: string
): Promise<any> {
  const tempoEstimado = tempoEstimadoMinutos ? parseInt(tempoEstimadoMinutos) : undefined;
  
  const result = await estimateServicePrice({
    category: categoria,
    description: descricao,
    estimatedTime: tempoEstimado,
  });
  
  if (!result.success) {
    return {
      suggestedPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      hourlyRate: 80,
      sampleSize: 0,
      basis: 'hourly_rate',
      notes: ['Não foi possível calcular a estimativa.'],
      disclaimer: 'Estimativa baseada em dados históricos. O valor final pode variar conforme complexidade e materiais.',
    };
  }
  
  return {
    suggestedPrice: result.suggestedPrice,
    minPrice: result.minPrice,
    maxPrice: result.maxPrice,
    hourlyRate: 80,
    sampleSize: result.sampleSize,
    basis: result.basis,
    notes: result.explanation,
    disclaimer: 'Estimativa baseada em dados históricos. O valor final pode variar conforme complexidade e materiais.',
  };
}
