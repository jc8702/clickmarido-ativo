import { z } from 'zod';

export const leadCreateSchema = z.object({
  name: z.string().min(1, 'Nome do lead é obrigatório').max(255),
  email: z.string().email('E-mail inválido').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  channel: z.string().min(1, 'Canal de origem é obrigatório'),
  campaign: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['FRIO', 'MORNO', 'QUENTE', 'URGENTE']),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  intention: z.string().optional().or(z.literal('')),
  nextAction: z.string().optional().or(z.literal('')),
  responsavelId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
});

export const leadBulkItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  channel: z.string().default('WhatsApp'),
  campaign: z.string().optional().or(z.literal('')),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']).default('MEDIA'),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  intention: z.string().optional().or(z.literal('')),
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
 * Fatores: temperatura, prioridade, valor estimado, intenção, dados de contato.
 */
export function calculateInitialScore(data: {
  status?: string;
  priority?: string;
  estimatedValue?: number | null;
  intention?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
}): number {
  let score = 0;

  // Temperatura (0-35 pontos)
  switch (data.status) {
    case 'URGENTE': score += 35; break;
    case 'QUENTE': score += 25; break;
    case 'MORNO': score += 15; break;
    case 'FRIO': score += 5; break;
    default: score += 10;
  }

  // Prioridade (0-20 pontos)
  switch (data.priority) {
    case 'ALTA': score += 20; break;
    case 'MEDIA': score += 10; break;
    case 'BAIXA': score += 5; break;
    default: score += 10;
  }

  // Valor estimado (0-20 pontos)
  if (data.estimatedValue) {
    if (data.estimatedValue >= 10000) score += 20;
    else if (data.estimatedValue >= 5000) score += 15;
    else if (data.estimatedValue >= 1000) score += 10;
    else if (data.estimatedValue > 0) score += 5;
  }

  // Intenção (0-15 pontos)
  switch (data.intention) {
    case 'pronto para fechamento': score += 15; break;
    case 'pronto para orçamento': score += 12; break;
    case 'comparando opções': score += 8; break;
    case 'apenas pesquisando': score += 3; break;
    case 'acompanhamento posterior': score += 5; break;
    default: score += 5;
  }

  // Dados de contato (0-10 pontos)
  if (data.hasPhone) score += 5;
  if (data.hasEmail) score += 5;

  return Math.min(100, Math.max(0, score));
}
