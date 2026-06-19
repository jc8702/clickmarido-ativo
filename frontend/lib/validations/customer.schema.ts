import { z } from 'zod';

export const addressSchema = z.object({
  id: z.string().optional(),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF com 2 letras'),
  postal_code: z.string().min(8, 'CEP inválido'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^\+55\d{10,11}$/, 'Formato: +5511999999999'),
  cpf_cnpj: z.string().min(11, 'Mínimo 11 dígitos').max(14).optional().or(z.literal('')),
  notes: z.string().optional(),
  addresses: z.array(addressSchema)
    .min(1, 'Pelo menos um endereço é obrigatório')
    .max(5, 'Máximo de 5 endereços permitidos'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type AddressFormValues = z.infer<typeof addressSchema>;
