"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumeInventorySchema = exports.ReserveInventorySchema = exports.CreateInventoryItemSchema = void 0;
const zod_1 = require("zod");
exports.CreateInventoryItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    sku: zod_1.z.string().min(1, 'SKU é obrigatório'),
    quantity_on_hand: zod_1.z.number().int().min(0, 'Quantidade não pode ser negativa'),
    quantity_minimum: zod_1.z.number().int().min(0),
    unit_cost: zod_1.z.number().positive(),
    unit_price: zod_1.z.number().positive(),
});
exports.ReserveInventorySchema = zod_1.z.object({
    serviceOrderId: zod_1.z.string().min(1),
    items: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive()
    }))
});
exports.ConsumeInventorySchema = zod_1.z.object({
    serviceOrderId: zod_1.z.string().min(1)
});
