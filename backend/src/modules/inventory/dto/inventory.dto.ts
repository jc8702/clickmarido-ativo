import { z } from 'zod';

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  quantity_on_hand: z.number().int().min(0, 'Quantidade não pode ser negativa'),
  quantity_minimum: z.number().int().min(0),
  unit_cost: z.number().positive(),
  unit_price: z.number().positive(),
});

export const ReserveInventorySchema = z.object({
  serviceOrderId: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().positive()
  }))
});

export const ConsumeInventorySchema = z.object({
  serviceOrderId: z.string().min(1)
});

export type CreateInventoryItemDto = z.infer<typeof CreateInventoryItemSchema>;
export type ReserveInventoryDto = z.infer<typeof ReserveInventorySchema>;
export type ConsumeInventoryDto = z.infer<typeof ConsumeInventorySchema>;
