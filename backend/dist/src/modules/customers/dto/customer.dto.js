"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSchema = exports.AddressSchema = void 0;
const zod_1 = require("zod");
exports.AddressSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    street: zod_1.z.string().min(1, 'Rua é obrigatória'),
    number: zod_1.z.string().min(1, 'Número é obrigatório'),
    neighborhood: zod_1.z.string().min(1, 'Bairro é obrigatório'),
    city: zod_1.z.string().min(1, 'Cidade é obrigatória'),
    state: zod_1.z.string().length(2, 'Estado deve ter 2 caracteres'),
    postal_code: zod_1.z.string().min(8, 'CEP inválido'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
exports.CustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: zod_1.z.string().email('E-mail inválido').optional(),
    phone: zod_1.z.string().regex(/^\+55\d{10,11}$/, 'Telefone deve estar no formato +55XXXXXXXXXXX'),
    cpf_cnpj: zod_1.z.string().min(11, 'CPF/CNPJ inválido').max(14).optional(),
    notes: zod_1.z.string().optional(),
    addresses: zod_1.z.array(exports.AddressSchema)
        .min(1, 'Pelo menos um endereço é obrigatório')
        .max(5, 'Máximo de 5 endereços permitidos'),
});
