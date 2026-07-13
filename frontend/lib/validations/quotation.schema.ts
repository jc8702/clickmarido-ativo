import { z } from 'zod';

export const quotationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.number().min(1, 'Mínimo 1'),
  unit_price: z.number().min(0, 'Não pode ser negativo'),
  cost_price: z.number().min(0).default(0),
  markup: z.number().min(1).default(1),
  sku: z.string().optional(),
  product_id: z.string().optional(),
  type: z.enum(['SERVICO', 'PECA']).default('SERVICO'),
});

export const quotationSchema = z.object({
  customer_id: z.string().min(1, 'Selecione um cliente'),
  items: z.array(quotationItemSchema).min(1, 'Adicione pelo menos 1 item'),
  discount_percentage: z.number().min(0).max(100).default(0),
  valid_until: z.string().min(1, 'Data de validade é obrigatória'),
  notes: z.string().optional(),
  payment_methods: z.string().optional(),
  execution_deadline: z.string().optional(),
  payment_method: z.enum(['PIX', 'DINHEIRO', 'CARTAO_CREDITO']).default('PIX'),
  installments: z.number().min(1).max(10).default(1),
  margin_percentage: z.number().min(0).max(100).default(0),
  travel_distance: z.number().min(0).default(0),
  travel_rate: z.number().min(0).default(1.10),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>;
