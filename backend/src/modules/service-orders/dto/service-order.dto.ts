import { z } from 'zod';

export const CreateServiceOrderSchema = z.object({
  quotation_id: z.string().min(1, 'ID do Orçamento é obrigatório'),
  scheduled_date: z.string().refine(val => new Date(val) >= new Date(new Date().setHours(0,0,0,0)), {
    message: 'A data agendada deve ser hoje ou no futuro',
  }),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM esperado'),
});

export const CompleteServiceOrderSchema = z.object({
  notes: z.string().optional(),
  finalTotal: z.number().min(0, 'O total final não pode ser negativo').optional(),
});

export const CancelServiceOrderSchema = z.object({
  reason: z.string().min(5, 'Forneça um motivo detalhado para o cancelamento'),
});

export const UploadPhotosSchema = z.object({
  before_photos: z.array(z.string().url()).optional(),
  after_photos: z.array(z.string().url()).optional(),
});

export type CreateServiceOrderDto = z.infer<typeof CreateServiceOrderSchema>;
export type CompleteServiceOrderDto = z.infer<typeof CompleteServiceOrderSchema>;
export type CancelServiceOrderDto = z.infer<typeof CancelServiceOrderSchema>;
export type UploadPhotosDto = z.infer<typeof UploadPhotosSchema>;
