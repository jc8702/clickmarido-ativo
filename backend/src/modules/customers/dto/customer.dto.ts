import { z } from 'zod';

export const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  postal_code: z.string().min(8, 'CEP inválido'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const CustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional(),
  phone: z.string().regex(/^\+55\d{10,11}$/, 'Telefone deve estar no formato +55XXXXXXXXXXX'),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido').max(14).optional(),
  notes: z.string().optional(),
  addresses: z.array(AddressSchema)
    .min(1, 'Pelo menos um endereço é obrigatório')
    .max(5, 'Máximo de 5 endereços permitidos'),
});

export type CustomerDto = z.infer<typeof CustomerSchema>;
export type AddressDto = z.infer<typeof AddressSchema>;
