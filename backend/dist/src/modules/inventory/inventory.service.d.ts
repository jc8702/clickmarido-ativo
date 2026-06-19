import { CreateInventoryItemDto, ReserveInventoryDto } from './dto/inventory.dto';
export declare let inventoryDb: any[];
export declare let movementsDb: any[];
export declare let reservationsDb: any[];
export declare class InventoryService {
    clear(): Promise<void>;
    createItem(tenantId: string, dto: CreateInventoryItemDto): Promise<any>;
    getLowStockItems(tenantId: string): Promise<any[]>;
    /**
     * TRANSACTION CRITICAL:
     * BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
     * SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;
     * -- Validar --
     * UPDATE inventory_items SET quantity_reserved = quantity_reserved + $2 WHERE id = $1;
     * COMMIT;
     */
    reserveForServiceOrder(tenantId: string, dto: ReserveInventoryDto): Promise<{
        message: string;
    }>;
    releaseReservation(tenantId: string, serviceOrderId: string): Promise<{
        message: string;
    }>;
    /**
     * TRANSACTION CRITICAL:
     * BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
     * SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;
     * UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $2, quantity_reserved = quantity_reserved - $2 WHERE id = $1;
     * INSERT INTO inventory_movements (...);
     * COMMIT;
     */
    consumeForServiceOrder(tenantId: string, serviceOrderId: string): Promise<{
        message: string;
    }>;
}
