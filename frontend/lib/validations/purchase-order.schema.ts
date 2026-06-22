import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
  productId: z.string().nullable().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 1 : parseFloat(val as string)),
    z.number().positive('Quantidade deve ser maior que zero')
  ),
  unit: z.string().default('un'),
  unitPrice: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative('Preço unitário deve ser maior ou igual a zero')
  ),
  discountAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative().default(0)
  ),
  taxAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative().default(0)
  ),
  notes: z.string().optional().default(''),
});

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, 'Fornecedor é obrigatório'),
  quotationId: z.string().nullable().optional(),
  serviceOrderId: z.string().nullable().optional(),
  expectedDeliveryDate: z.string().nullable().optional(),
  paymentTerms: z.string().optional().default(''),
  paymentMethod: z.string().optional().default(''),
  costCenter: z.string().optional().default(''),
  requestedBy: z.string().optional().default(''),
  deliveryAddress: z.string().optional().default(''),
  discountAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative().default(0)
  ),
  freightAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative().default(0)
  ),
  taxAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseFloat(val as string)),
    z.number().nonnegative().default(0)
  ),
  internalNotes: z.string().optional().default(''),
  supplierTerms: z.string().optional().default(''),
  items: z.array(purchaseOrderItemSchema).min(1, 'Adicione pelo menos um item'),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
