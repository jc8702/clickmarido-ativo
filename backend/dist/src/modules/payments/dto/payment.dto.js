"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundPaymentSchema = exports.CreatePaymentSchema = void 0;
const zod_1 = require("zod");
exports.CreatePaymentSchema = zod_1.z.object({
    serviceOrderId: zod_1.z.string().min(1, 'ID da Ordem de Serviço é obrigatório'),
    method: zod_1.z.enum(['pix', 'cartao', 'boleto'], { required_error: 'Método inválido' }),
    amount: zod_1.z.number().positive('O valor deve ser positivo')
});
exports.RefundPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('O valor de reembolso deve ser positivo')
});
