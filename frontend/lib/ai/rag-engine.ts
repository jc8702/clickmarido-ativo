import { Intent } from './intent-router';
import * as fs from 'fs';
import * as path from 'path';

// ==========================================
// RAG ENGINE - Retrieval-Augmented Generation
// Busca contexto relevante na base de conhecimento
// ==========================================

interface KBDocument {
  id: string;
  title: string;
  content: string;
  category: 'service' | 'system' | 'operation' | 'governance' | 'faq';
  tags: string[];
  filePath: string;
}

interface SearchResult {
  document: KBDocument;
  score: number;
  relevantSections: string[];
}

// Cache de documentos carregados
let documentsCache: KBDocument[] | null = null;

// Mapeamento de intenções para categorias
const INTENT_CATEGORY_MAP: Record<Intent, string[]> = {
  servico_eletrica: ['service', 'faq'],
  servico_hidraulica: ['service', 'faq'],
  servico_automacao_residencial: ['service', 'faq'],
  servico_montagem_moveis: ['service', 'faq'],
  sistema_uso_geral: ['system', 'faq'],
  sistema_modulos: ['system', 'faq'],
  suporte_tecnico: ['system', 'faq'],
  abertura_chamado: ['operation'],
  status_solicitacao: ['system', 'operation'],
  humano: ['operation'],
  desconhecido: ['faq'],
};

// Mapeamento de intenções para palavras-chave específicas
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  servico_eletrica: ['elétrica', 'eletrica', 'eletricidade', 'tomada', 'disjuntor', 'fiação', 'luz', 'iluminação'],
  servico_hidraulica: ['hidráulica', 'hidraulica', 'vazamento', 'torneira', 'água', 'encanamento', 'desentupir'],
  servico_automacao_residencial: ['automação', 'automacao', 'smart home', 'casa inteligente', 'portão', 'fechadura'],
  servico_montagem_moveis: ['móvel', 'movel', 'montagem', 'armário', 'estante', 'IKEA', 'parafuso'],
  sistema_uso_geral: ['como usar', 'como funciona', 'ajuda', 'tutorial', 'configuração'],
  sistema_modulos: ['módulo', 'modulo', 'cliente', 'orçamento', 'OS', 'pagamento', 'dashboard'],
  suporte_tecnico: ['erro', 'bug', 'problema', 'não funciona', 'travou', 'lento'],
  abertura_chamado: ['abrir chamado', 'solicitar', 'atendimento', 'suporte'],
  status_solicitacao: ['status', 'situação', 'andamento', 'onde está', 'previsão'],
  humano: ['humano', 'pessoa', 'atendente', 'especialista'],
  desconhecido: [],
};

// Carregar documentos da base de conhecimento
function loadDocuments(): KBDocument[] {
  if (documentsCache) {
    return documentsCache;
  }

  const basePath = path.join(process.cwd(), 'lib', 'ai', 'knowledge-base');
  const documents: KBDocument[] = [];

  // Carregar documentos de serviços
  const servicesPath = path.join(basePath, 'services');
  if (fs.existsSync(servicesPath)) {
    const files = fs.readdirSync(servicesPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(servicesPath, file), 'utf-8');
        documents.push({
          id: `service-${file.replace('.md', '')}`,
          title: extractTitle(content),
          content,
          category: 'service',
          tags: extractTags(content),
          filePath: path.join('services', file),
        });
      }
    }
  }

  // Carregar documentos do sistema
  const systemPath = path.join(basePath, 'system');
  if (fs.existsSync(systemPath)) {
    const files = fs.readdirSync(systemPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(systemPath, file), 'utf-8');
        documents.push({
          id: `system-${file.replace('.md', '')}`,
          title: extractTitle(content),
          content,
          category: 'system',
          tags: extractTags(content),
          filePath: path.join('system', file),
        });
      }
    }
  }

  // Carregar documentos de operação
  const operationsPath = path.join(basePath, 'operations');
  if (fs.existsSync(operationsPath)) {
    const files = fs.readdirSync(operationsPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(operationsPath, file), 'utf-8');
        documents.push({
          id: `operation-${file.replace('.md', '')}`,
          title: extractTitle(content),
          content,
          category: 'operation',
          tags: extractTags(content),
          filePath: path.join('operations', file),
        });
      }
    }
  }

  // Carregar governança
  const governancePath = path.join(basePath, 'governance');
  if (fs.existsSync(governancePath)) {
    const files = fs.readdirSync(governancePath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(governancePath, file), 'utf-8');
        documents.push({
          id: `governance-${file.replace('.md', '')}`,
          title: extractTitle(content),
          content,
          category: 'governance',
          tags: extractTags(content),
          filePath: path.join('governance', file),
        });
      }
    }
  }

  // Carregar FAQ
  const faqPath = path.join(basePath, 'faq');
  if (fs.existsSync(faqPath)) {
    const files = fs.readdirSync(faqPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(faqPath, file), 'utf-8');
        documents.push({
          id: `faq-${file.replace('.md', '')}`,
          title: extractTitle(content),
          content,
          category: 'faq',
          tags: extractTags(content),
          filePath: path.join('faq', file),
        });
      }
    }
  }

  documentsCache = documents;
  return documents;
}

// Extrair título do documento
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/[#*_`]/g, '').trim() : 'Documento';
}

// Extrair tags do conteúdo
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const normalized = content.toLowerCase();
  
  // Tags de serviço
  if (normalized.includes('elétrica') || normalized.includes('eletrica')) tags.push('elétrica');
  if (normalized.includes('hidráulica') || normalized.includes('hidraulica')) tags.push('hidráulica');
  if (normalized.includes('automação') || normalized.includes('automacao')) tags.push('automação');
  if (normalized.includes('móvel') || normalized.includes('movel') || normalized.includes('montagem')) tags.push('móveis');
  
  // Tags de sistema
  if (normalized.includes('orçamento') || normalized.includes('orcamento')) tags.push('orçamento');
  if (normalized.includes('ordem de serviço') || normalized.includes('os ')) tags.push('OS');
  if (normalized.includes('pagamento')) tags.push('pagamento');
  if (normalized.includes('cliente')) tags.push('cliente');
  if (normalized.includes('erro') || normalized.includes('bug')) tags.push('erro');
  
  return [...new Set(tags)];
}

// Normalizar texto para busca
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calcular pontuação de relevância
function calculateRelevanceScore(query: string, document: KBDocument, intent: Intent): number {
  const normalizedQuery = normalizeText(query);
  const normalizedContent = normalizeText(document.content);
  const queryWords = normalizedQuery.split(' ');
  
  let score = 0;
  
  // 1. Verificar se a intenção corresponde à categoria
  const relevantCategories = INTENT_CATEGORY_MAP[intent] || [];
  if (relevantCategories.includes(document.category)) {
    score += 10;
  }
  
  // 2. Verificar palavras-chave da intenção
  const intentKw = INTENT_KEYWORDS[intent] || [];
  for (const kw of intentKw) {
    if (normalizedQuery.includes(normalizeText(kw))) {
      score += 5;
    }
  }
  
  // 3. Verificar correspondência de palavras no conteúdo
  for (const word of queryWords) {
    if (word.length < 3) continue; // Ignorar palavras muito curtas
    
    // Contar ocorrências no conteúdo
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = normalizedContent.match(regex);
    if (matches) {
      score += matches.length * 2;
    }
  }
  
  // 4. Verificar tags
  for (const tag of document.tags) {
    if (normalizedQuery.includes(normalizeText(tag))) {
      score += 3;
    }
  }
  
  // 5. Bônus para documentos de FAQ (geralmente mais diretos)
  if (document.category === 'faq') {
    score += 2;
  }
  
  return score;
}

// Buscar documentos relevantes
export function searchKnowledgeBase(
  query: string,
  intent: Intent,
  maxResults: number = 3
): SearchResult[] {
  const documents = loadDocuments();
  
  // Calcular pontuação para cada documento
  const results: SearchResult[] = documents.map(doc => ({
    document: doc,
    score: calculateRelevanceScore(query, doc, intent),
    relevantSections: extractRelevantSections(query, doc.content),
  }));
  
  // Filtrar e ordenar
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// Extrair seções relevantes do documento
function extractRelevantSections(query: string, content: string): string[] {
  const sections: string[] = [];
  const lines = content.split('\n');
  
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // Salvar seção anterior se relevante
      if (currentSection && currentContent.length > 0) {
        const sectionText = currentContent.join('\n');
        if (isRelevantToQuery(query, sectionText)) {
          sections.push(`${currentSection}\n${sectionText}`);
        }
      }
      currentSection = line;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  
  // Última seção
  if (currentSection && currentContent.length > 0) {
    const sectionText = currentContent.join('\n');
    if (isRelevantToQuery(query, sectionText)) {
      sections.push(`${currentSection}\n${sectionText}`);
    }
  }
  
  return sections.slice(0, 3); // Máximo 3 seções
}

// Verificar se seção é relevante
function isRelevantToQuery(query: string, text: string): boolean {
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  const queryWords = normalizedQuery.split(' ');
  
  let matchCount = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (normalizedText.includes(word)) {
      matchCount++;
    }
  }
  
  return matchCount >= Math.ceil(queryWords.length * 0.3); // Pelo menos 30% das palavras
}

// Construir contexto para o LLM
export function buildContext(
  query: string,
  intent: Intent,
  maxTokens: number = 2000
): string {
  const results = searchKnowledgeBase(query, intent, 3);
  
  if (results.length === 0) {
    return '';
  }
  
  let context = 'CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:\n\n';
  let totalLength = 0;
  
  for (const result of results) {
    const section = `\n--- ${result.document.title} ---\n`;
    
    // Usar seções relevantes se disponíveis
    if (result.relevantSections.length > 0) {
      for (const sectionContent of result.relevantSections) {
        const content = `${section}${sectionContent}\n`;
        if (totalLength + content.length < maxTokens) {
          context += content + '\n';
          totalLength += content.length;
        }
      }
    } else {
      // Usar início do documento
      const content = `${section}${result.document.content.substring(0, 1000)}\n`;
      if (totalLength + content.length < maxTokens) {
        context += content + '\n';
        totalLength += content.length;
      }
    }
  }
  
  return context;
}

// Limpar cache (para atualizações)
export function clearKnowledgeBaseCache() {
  documentsCache = null;
}

// Estatísticas da base
export function getKnowledgeBaseStats() {
  const documents = loadDocuments();
  
  return {
    totalDocuments: documents.length,
    byCategory: {
      service: documents.filter(d => d.category === 'service').length,
      system: documents.filter(d => d.category === 'system').length,
      operation: documents.filter(d => d.category === 'operation').length,
      governance: documents.filter(d => d.category === 'governance').length,
      faq: documents.filter(d => d.category === 'faq').length,
    },
  };
}
