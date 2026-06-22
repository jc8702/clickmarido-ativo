import { z } from 'zod';

export const quotationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.number().min(1, 'Mínimo 1'),
  unit_price: z.number().min(0, 'Não pode ser negativo'),
  sku: z.string().optional(),
  product_id: z.string().optional(),
});

export const quotationSchema = z.object({
  customer_id: z.string().min(1, 'Selecione um cliente'),
  items: z.array(quotationItemSchema).min(1, 'Adicione pelo menos 1 item'),
  discount: z.number().min(0),
  valid_until: z.string().min(1, 'Data de validade é obrigatória'),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>;
