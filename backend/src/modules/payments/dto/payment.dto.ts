import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  serviceOrderId: z.string().min(1, 'ID da Ordem de Serviço é obrigatório'),
  method: z.enum(['pix', 'cartao', 'boleto'], { required_error: 'Método inválido' }),
  amount: z.number().positive('O valor deve ser positivo')
});

export const RefundPaymentSchema = z.object({
  amount: z.number().positive('O valor de reembolso deve ser positivo')
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;
