import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, ReserveInventoryDto, ConsumeInventoryDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(tenantId: string): Promise<any[]>;
    getLowStockItems(tenantId: string): Promise<any[]>;
    createItem(tenantId: string, body: CreateInventoryItemDto): Promise<any>;
    reserve(tenantId: string, body: ReserveInventoryDto): Promise<{
        message: string;
    }>;
    release(tenantId: string, body: ConsumeInventoryDto): Promise<{
        message: string;
    }>;
    consume(tenantId: string, body: ConsumeInventoryDto): Promise<{
        message: string;
    }>;
}
