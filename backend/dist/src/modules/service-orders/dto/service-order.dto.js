"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadPhotosSchema = exports.CancelServiceOrderSchema = exports.CompleteServiceOrderSchema = exports.CreateServiceOrderSchema = void 0;
const zod_1 = require("zod");
exports.CreateServiceOrderSchema = zod_1.z.object({
    quotation_id: zod_1.z.string().min(1, 'ID do Orçamento é obrigatório'),
    scheduled_date: zod_1.z.string().refine(val => new Date(val) >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'A data agendada deve ser hoje ou no futuro',
    }),
    scheduled_time: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM esperado'),
});
exports.CompleteServiceOrderSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    finalTotal: zod_1.z.number().min(0, 'O total final não pode ser negativo').optional(),
});
exports.CancelServiceOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, 'Forneça um motivo detalhado para o cancelamento'),
});
exports.UploadPhotosSchema = zod_1.z.object({
    before_photos: zod_1.z.array(zod_1.z.string().url()).optional(),
    after_photos: zod_1.z.array(zod_1.z.string().url()).optional(),
});
