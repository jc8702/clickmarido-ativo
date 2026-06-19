import { z } from 'zod';

export const QuotationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.number().min(1, 'A quantidade deve ser pelo menos 1'),
  unit_price: z.number().min(0, 'O preço não pode ser negativo'),
});

export const QuotationSchema = z.object({
  customer_id: z.string().uuid().or(z.string().min(1, 'ID do cliente é obrigatório')),
  items: z.array(QuotationItemSchema).min(1, 'O orçamento deve ter pelo menos 1 item'),
  discount: z.number().min(0).default(0),
  valid_until: z.string().or(z.date()).refine(val => new Date(val) > new Date(), {
    message: 'A validade deve ser uma data no futuro',
  }),
});

export type QuotationDto = z.infer<typeof QuotationSchema>;
export type QuotationItemDto = z.infer<typeof QuotationItemSchema>;
