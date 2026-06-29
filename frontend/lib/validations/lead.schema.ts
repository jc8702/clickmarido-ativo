import { z } from 'zod';

export const leadCreateSchema = z.object({
  name: z.string().min(1, 'Nome do lead é obrigatório').max(255),
  email: z.string().email('E-mail inválido').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  channel: z.string().min(1, 'Canal de origem é obrigatório'),
  campaign: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['FRIO', 'MORNO', 'QUENTE', 'URGENTE']),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  intention: z.enum([
    'PESQUISANDO',
    'COMPARANDO',
    'PRONTO_PARA_ORCAMENTO',
    'PRONTO_PARA_FECHAMENTO',
    'ACOMPANHAR_DEPOIS',
  ]).optional().nullable(),
  nextAction: z.enum([
    'LIGAR',
    'RESPONDER_WHATSAPP',
    'ENVIAR_PROPOSTA',
    'AGENDAR_VISITA',
    'AGENDAR_REUNIAO',
    'PEDIR_MAIS_INFORMACOES',
    'NUTRIR_LEAD',
    'ENCAMINHAR_ORCAMENTO',
    'DESCARTAR',
  ]).optional().nullable(),
  qualificationStage: z.enum([
    'QUALIFICADO',
    'PARCIALMENTE_QUALIFICADO',
    'EM_VALIDACAO',
    'DESQUALIFICADO',
    'SEM_VALIDACAO',
  ]).optional().nullable(),
  responsavelId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  
  // BANT
  bantBudget: z.enum(['sim', 'nao', 'em_analise', 'indefinido']).optional().nullable(),
  bantAuthority: z.enum(['decisor', 'influenciador', 'nao_identificado']).optional().nullable(),
  bantNeed: z.enum(['critico', 'importante', 'nice_to_have', 'sem_necessidade']).optional().nullable(),
  bantTiming: z.enum(['imediato', '1_3_meses', '3_6_meses', 'acima_6_meses', 'indefinido']).optional().nullable(),
  
  // CHAMP
  champChallenge: z.enum(['critico', 'importante', 'moderado', 'sem_desafio']).optional().nullable(),
  champMoney: z.enum(['disponivel', 'aprovado', 'em_analise', 'sem_orcamento']).optional().nullable(),
  champPriority: z.enum(['urgente', 'alta', 'media', 'baixa']).optional().nullable(),
});

export const leadBulkItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  channel: z.string().default('WhatsApp'),
  campaign: z.string().optional().or(z.literal('')),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  intention: z.enum([
    'PESQUISANDO',
    'COMPARANDO',
    'PRONTO_PARA_ORCAMENTO',
    'PRONTO_PARA_FECHAMENTO',
    'ACOMPANHAR_DEPOIS',
  ]).optional().nullable(),
  responsavelId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const leadBulkSchema = z.object({
  leads: z.array(leadBulkItemSchema).min(1, 'Adicione pelo menos 1 lead').max(500, 'Máximo 500 leads por importação'),
});

export type LeadCreateValues = z.infer<typeof leadCreateSchema>;
export type LeadBulkItemValues = z.infer<typeof leadBulkItemSchema>;
export type LeadBulkValues = z.infer<typeof leadBulkSchema>;

/**
 * Calcula score inicial do lead (0-100) baseado nos dados fornecidos na entrada.
 * Fatores: temperatura, prioridade, valor estimado, intenção, dados de contato, BANT.
 */
export function calculateInitialScore(data: {
  status?: string;
  priority?: string;
  estimatedValue?: number | null;
  intention?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  bantBudget?: string | null;
  bantAuthority?: string | null;
  bantNeed?: string | null;
  bantTiming?: string | null;
}): number {
  let score = 0;

  // Temperatura (0-30 pontos)
  switch (data.status) {
    case 'URGENTE': score += 30; break;
    case 'QUENTE': score += 22; break;
    case 'MORNO': score += 12; break;
    case 'FRIO': score += 5; break;
    default: score += 8;
  }

  // Prioridade (0-15 pontos)
  switch (data.priority) {
    case 'URGENTE': score += 15; break;
    case 'ALTA': score += 12; break;
    case 'MEDIA': score += 8; break;
    case 'BAIXA': score += 3; break;
    default: score += 8;
  }

  // Valor estimado (0-15 pontos)
  if (data.estimatedValue) {
    if (data.estimatedValue >= 10000) score += 15;
    else if (data.estimatedValue >= 5000) score += 12;
    else if (data.estimatedValue >= 1000) score += 8;
    else if (data.estimatedValue > 0) score += 4;
  }

  // Intenção (0-12 pontos)
  switch (data.intention) {
    case 'PRONTO_PARA_FECHAMENTO': score += 12; break;
    case 'PRONTO_PARA_ORCAMENTO': score += 10; break;
    case 'COMPARANDO': score += 6; break;
    case 'PESQUISANDO': score += 2; break;
    case 'ACOMPANHAR_DEPOIS': score += 4; break;
    default: score += 4;
  }

  // Dados de contato (0-8 pontos)
  if (data.hasPhone) score += 4;
  if (data.hasEmail) score += 4;

  // BANT (0-20 pontos)
  if (data.bantBudget === 'sim') score += 5;
  else if (data.bantBudget === 'em_analise') score += 3;
  
  if (data.bantAuthority === 'decisor') score += 5;
  else if (data.bantAuthority === 'influenciador') score += 3;
  
  if (data.bantNeed === 'critico') score += 5;
  else if (data.bantNeed === 'importante') score += 3;
  
  if (data.bantTiming === 'imediato') score += 5;
  else if (data.bantTiming === '1_3_meses') score += 3;

  return Math.min(100, Math.max(0, score));
}
