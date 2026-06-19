import { z } from 'zod';
export declare const CreatePaymentSchema: any;
export declare const RefundPaymentSchema: any;
export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;
