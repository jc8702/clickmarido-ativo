"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = exports.reservationsDb = exports.movementsDb = exports.inventoryDb = void 0;
const common_1 = require("@nestjs/common");
// IN-MEMORY DB Mock
exports.inventoryDb = [];
exports.movementsDb = [];
exports.reservationsDb = [];
// MUTEX para controle de Concorrência (Simulando SELECT ... FOR UPDATE)
class Mutex {
    queue = [];
    locked = false;
    async lock() {
        if (!this.locked) {
            this.locked = true;
            return Promise.resolve();
        }
        return new Promise(resolve => this.queue.push(resolve));
    }
    unlock() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next)
                next();
        }
        else {
            this.locked = false;
        }
    }
}
// Mapa de locks por ID de item (Row-level lock simulation)
const itemLocks = new Map();
const getLock = (id) => {
    if (!itemLocks.has(id))
        itemLocks.set(id, new Mutex());
    return itemLocks.get(id);
};
let InventoryService = class InventoryService {
    // Apenas para setup dos testes
    async clear() {
        exports.inventoryDb = [];
        exports.movementsDb = [];
        exports.reservationsDb = [];
        itemLocks.clear();
    }
    async createItem(tenantId, dto) {
        const item = {
            id: Math.random().toString(36).substring(7),
            tenantId,
            ...dto,
            quantity_reserved: 0
        };
        exports.inventoryDb.push(item);
        return item;
    }
    async getLowStockItems(tenantId) {
        const lowStock = exports.inventoryDb.filter(i => i.tenantId === tenantId && (i.quantity_on_hand - i.quantity_reserved) < i.quantity_minimum);
        if (lowStock.length > 0) {
            console.log(`[ALERTA MOCK] Estoque Baixo Detectado para ${lowStock.length} itens. Notificando Admin.`);
        }
        return lowStock;
    }
    /**
     * TRANSACTION CRITICAL:
     * BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
     * SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;
     * -- Validar --
     * UPDATE inventory_items SET quantity_reserved = quantity_reserved + $2 WHERE id = $1;
     * COMMIT;
     */
    async reserveForServiceOrder(tenantId, dto) {
        // Para transações envolvendo múltiplos itens, a ordem de lock importa para evitar Deadlocks.
        // Ordenamos os IDs de forma lexicográfica (sempre travamos do menor para o maior ID)
        const sortedItems = [...dto.items].sort((a, b) => a.itemId.localeCompare(b.itemId));
        // Trava (Lock FOR UPDATE)
        for (const req of sortedItems) {
            const lock = getLock(req.itemId);
            await lock.lock();
        }
        try {
            // 1. Validar Estoque
            for (const req of sortedItems) {
                const item = exports.inventoryDb.find(i => i.id === req.itemId && i.tenantId === tenantId);
                if (!item) {
                    throw new common_1.NotFoundException(`Item ${req.itemId} não localizado.`);
                }
                const available = item.quantity_on_hand - item.quantity_reserved;
                if (available < req.quantity) {
                    // A exceção será pega, os locks liberados, e revertendo estado. (Rollback)
                    throw new common_1.BadRequestException(`Estoque insuficiente para o item ${item.name}. Disponível: ${available}, Requisitado: ${req.quantity}`);
                }
            }
            // 2. Commit / Atualiza Reservas se todos passarem na validação
            for (const req of sortedItems) {
                const item = exports.inventoryDb.find(i => i.id === req.itemId && i.tenantId === tenantId);
                item.quantity_reserved += req.quantity;
                exports.reservationsDb.push({
                    serviceOrderId: dto.serviceOrderId,
                    itemId: req.itemId,
                    quantity: req.quantity
                });
            }
            return { message: 'Reserva efetuada com sucesso.' };
        }
        finally {
            // Libera (Release / Commit / Rollback finalization)
            for (const req of sortedItems) {
                getLock(req.itemId).unlock();
            }
        }
    }
    async releaseReservation(tenantId, serviceOrderId) {
        const reserves = exports.reservationsDb.filter(r => r.serviceOrderId === serviceOrderId);
        for (const res of reserves) {
            const item = exports.inventoryDb.find(i => i.id === res.itemId && i.tenantId === tenantId);
            if (item) {
                item.quantity_reserved -= res.quantity;
            }
        }
        // Remove as reservas da OS
        exports.reservationsDb = exports.reservationsDb.filter(r => r.serviceOrderId !== serviceOrderId);
        return { message: 'Reserva desfeita com sucesso.' };
    }
    /**
     * TRANSACTION CRITICAL:
     * BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
     * SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;
     * UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $2, quantity_reserved = quantity_reserved - $2 WHERE id = $1;
     * INSERT INTO inventory_movements (...);
     * COMMIT;
     */
    async consumeForServiceOrder(tenantId, serviceOrderId) {
        const reserves = exports.reservationsDb.filter(r => r.serviceOrderId === serviceOrderId);
        if (reserves.length === 0) {
            throw new common_1.BadRequestException('Nenhuma reserva encontrada para esta OS.');
        }
        const sortedReserves = [...reserves].sort((a, b) => a.itemId.localeCompare(b.itemId));
        // Lock FOR UPDATE
        for (const res of sortedReserves) {
            await getLock(res.itemId).lock();
        }
        try {
            for (const res of sortedReserves) {
                const item = exports.inventoryDb.find(i => i.id === res.itemId && i.tenantId === tenantId);
                if (item) {
                    // Decrementa o estoque real e a reserva
                    item.quantity_on_hand -= res.quantity;
                    item.quantity_reserved -= res.quantity;
                    // Registrar Movimentação
                    exports.movementsDb.push({
                        id: Math.random().toString(36).substring(7),
                        tenantId,
                        item_id: res.itemId,
                        service_order_id: serviceOrderId,
                        type: 'saida',
                        quantity: res.quantity,
                        created_at: new Date()
                    });
                }
            }
            // Cleanup
            exports.reservationsDb = exports.reservationsDb.filter(r => r.serviceOrderId !== serviceOrderId);
            return { message: 'Estoque consumido com sucesso.' };
        }
        finally {
            // Destrava
            for (const res of sortedReserves) {
                getLock(res.itemId).unlock();
            }
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
