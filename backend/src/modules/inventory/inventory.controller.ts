import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService, inventoryDb } from './inventory.service';
import { CreateInventoryItemDto, CreateInventoryItemSchema, ReserveInventoryDto, ReserveInventorySchema, ConsumeInventoryDto, ConsumeInventorySchema } from './dto/inventory.dto';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { JwtGuard } from '../../shared/guards/jwt.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';

@Controller('inventory')
@UseGuards(TenantGuard, JwtGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return inventoryDb.filter(i => i.tenantId === tenantId);
  }

  @Get('low-stock')
  async getLowStockItems(@CurrentTenant() tenantId: string) {
    return this.inventoryService.getLowStockItems(tenantId);
  }

  @Post()
  async createItem(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateInventoryItemSchema)) body: CreateInventoryItemDto
  ) {
    return this.inventoryService.createItem(tenantId, body);
  }

  @Post('reserve')
  async reserve(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ReserveInventorySchema)) body: ReserveInventoryDto
  ) {
    return this.inventoryService.reserveForServiceOrder(tenantId, body);
  }

  @Post('release')
  async release(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ConsumeInventorySchema)) body: ConsumeInventoryDto
  ) {
    return this.inventoryService.releaseReservation(tenantId, body.serviceOrderId);
  }

  @Post('consume')
  async consume(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ConsumeInventorySchema)) body: ConsumeInventoryDto
  ) {
    return this.inventoryService.consumeForServiceOrder(tenantId, body.serviceOrderId);
  }
}
