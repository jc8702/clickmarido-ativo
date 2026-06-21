import { z } from 'zod';

export const CustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

export const QuotationItemSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
});

export const QuotationSchema = z.object({
  customerId: z.string().min(1, 'Cliente obrigatório'),
  items: z.array(QuotationItemSchema).min(1, 'Deve ter pelo menos um item'),
  notes: z.string().optional().default(''),
});

export type QuotationInput = z.infer<typeof QuotationSchema>;

export const WarrantySchema = z.object({
  quotationId: z.string().min(1, 'Orçamento obrigatório'),
  customerId: z.string().min(1, 'Cliente obrigatório'),
  service_description: z.string().min(1, 'Descrição do serviço obrigatória'),
  expiry_date: z.string().datetime('Data inválida'),
});

export type WarrantyInput = z.infer<typeof WarrantySchema>;
