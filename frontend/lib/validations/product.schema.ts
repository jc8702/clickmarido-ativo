import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  sku: z.string().max(50, 'SKU muito longo').optional().or(z.literal('')),
  type: z.enum(['SERVICO', 'PECA'], { message: 'Tipo deve ser Serviço ou Peça' }),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  unit: z.string().min(1, 'Unidade é obrigatória').max(10, 'Unidade muito longa'),
  category: z.string().max(200, 'Categoria muito longa').optional(),
  active: z.boolean().optional(),
  vendorId: z.string().optional().nullable().or(z.literal('')),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0),
  estimatedTime: z.number().int().min(1),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
});

export type ProductFormValues = z.infer<typeof productSchema>;
