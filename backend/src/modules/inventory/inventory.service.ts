import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateInventoryItemDto, ReserveInventoryDto } from './dto/inventory.dto';

// IN-MEMORY DB Mock
export let inventoryDb: any[] = [];
export let movementsDb: any[] = [];
export let reservationsDb: any[] = [];

// MUTEX para controle de Concorrência (Simulando SELECT ... FOR UPDATE)
class Mutex {
  private queue: Array<(value: void) => void> = [];
  private locked = false;

  async lock(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

// Mapa de locks por ID de item (Row-level lock simulation)
const itemLocks = new Map<string, Mutex>();
const getLock = (id: string) => {
  if (!itemLocks.has(id)) itemLocks.set(id, new Mutex());
  return itemLocks.get(id);
};

@Injectable()
export class InventoryService {

  // Apenas para setup dos testes
  async clear() {
    inventoryDb = [];
    movementsDb = [];
    reservationsDb = [];
    itemLocks.clear();
  }

  async createItem(tenantId: string, dto: CreateInventoryItemDto) {
    const item = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      ...dto,
      quantity_reserved: 0
    };
    inventoryDb.push(item);
    return item;
  }

  async getLowStockItems(tenantId: string) {
    const lowStock = inventoryDb.filter(
      i => i.tenantId === tenantId && (i.quantity_on_hand - i.quantity_reserved) < i.quantity_minimum
    );
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
  async reserveForServiceOrder(tenantId: string, dto: ReserveInventoryDto) {
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
        const item = inventoryDb.find(i => i.id === req.itemId && i.tenantId === tenantId);
        if (!item) {
          throw new NotFoundException(`Item ${req.itemId} não localizado.`);
        }
        
        const available = item.quantity_on_hand - item.quantity_reserved;
        if (available < req.quantity) {
          // A exceção será pega, os locks liberados, e revertendo estado. (Rollback)
          throw new BadRequestException(`Estoque insuficiente para o item ${item.name}. Disponível: ${available}, Requisitado: ${req.quantity}`);
        }
      }

      // 2. Commit / Atualiza Reservas se todos passarem na validação
      for (const req of sortedItems) {
        const item = inventoryDb.find(i => i.id === req.itemId && i.tenantId === tenantId);
        item.quantity_reserved += req.quantity;
        
        reservationsDb.push({
          serviceOrderId: dto.serviceOrderId,
          itemId: req.itemId,
          quantity: req.quantity
        });
      }

      return { message: 'Reserva efetuada com sucesso.' };
      
    } finally {
      // Libera (Release / Commit / Rollback finalization)
      for (const req of sortedItems) {
        getLock(req.itemId).unlock();
      }
    }
  }

  async releaseReservation(tenantId: string, serviceOrderId: string) {
    const reserves = reservationsDb.filter(r => r.serviceOrderId === serviceOrderId);
    for (const res of reserves) {
      const item = inventoryDb.find(i => i.id === res.itemId && i.tenantId === tenantId);
      if (item) {
        item.quantity_reserved -= res.quantity;
      }
    }
    // Remove as reservas da OS
    reservationsDb = reservationsDb.filter(r => r.serviceOrderId !== serviceOrderId);
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
  async consumeForServiceOrder(tenantId: string, serviceOrderId: string) {
    const reserves = reservationsDb.filter(r => r.serviceOrderId === serviceOrderId);
    if (reserves.length === 0) {
      throw new BadRequestException('Nenhuma reserva encontrada para esta OS.');
    }

    const sortedReserves = [...reserves].sort((a, b) => a.itemId.localeCompare(b.itemId));

    // Lock FOR UPDATE
    for (const res of sortedReserves) {
      await getLock(res.itemId).lock();
    }

    try {
      for (const res of sortedReserves) {
        const item = inventoryDb.find(i => i.id === res.itemId && i.tenantId === tenantId);
        if (item) {
          // Decrementa o estoque real e a reserva
          item.quantity_on_hand -= res.quantity;
          item.quantity_reserved -= res.quantity;

          // Registrar Movimentação
          movementsDb.push({
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
      reservationsDb = reservationsDb.filter(r => r.serviceOrderId !== serviceOrderId);
      return { message: 'Estoque consumido com sucesso.' };

    } finally {
      // Destrava
      for (const res of sortedReserves) {
        getLock(res.itemId).unlock();
      }
    }
  }
}
