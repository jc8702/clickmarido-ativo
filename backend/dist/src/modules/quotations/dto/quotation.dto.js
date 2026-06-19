"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationSchema = exports.QuotationItemSchema = void 0;
const zod_1 = require("zod");
exports.QuotationItemSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Nome do item é obrigatório'),
    quantity: zod_1.z.number().min(1, 'A quantidade deve ser pelo menos 1'),
    unit_price: zod_1.z.number().min(0, 'O preço não pode ser negativo'),
});
exports.QuotationSchema = zod_1.z.object({
    customer_id: zod_1.z.string().uuid().or(zod_1.z.string().min(1, 'ID do cliente é obrigatório')),
    items: zod_1.z.array(exports.QuotationItemSchema).min(1, 'O orçamento deve ter pelo menos 1 item'),
    discount: zod_1.z.number().min(0).default(0),
    valid_until: zod_1.z.string().or(zod_1.z.date()).refine(val => new Date(val) > new Date(), {
        message: 'A validade deve ser uma data no futuro',
    }),
});
