import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome não deve exceder 255 caracteres'),
  tradeName: z.string().optional().default(''),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  cnpjCpf: z.string().optional().or(z.literal('')),
  stateRegistration: z.string().optional().default(''),
  municipalRegistration: z.string().optional().default(''),
  address: z.string().optional().default(''),
  contactName: z.string().optional().default(''),
  category: z.enum(['MATERIAL', 'SERVICO', 'TRANSPORTE', 'EQUIPAMENTO', 'TERCEIRIZADO', 'OUTROS']).default('OUTROS'),
  classification: z.enum(['A', 'B', 'C', 'D']).default('B'),
  paymentTerms: z.string().optional().default(''),
  averageDeliveryDays: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? 0 : parseInt(val as string, 10)),
    z.number().int().nonnegative('Prazo deve ser zero ou maior')
  ).optional().default(0),
  isActive: z.boolean().default(true),
  isBlocked: z.boolean().default(false),
  notes: z.string().optional().default(''),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
