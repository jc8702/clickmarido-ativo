import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto, CreateServiceOrderSchema, CompleteServiceOrderDto, CompleteServiceOrderSchema, CancelServiceOrderDto, CancelServiceOrderSchema, UploadPhotosDto, UploadPhotosSchema } from './dto/service-order.dto';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { JwtGuard } from '../../shared/guards/jwt.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';

@Controller('service-orders')
@UseGuards(TenantGuard, JwtGuard)
export class ServiceOrdersController {
  constructor(private readonly osService: ServiceOrdersService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string, @Query('status') status: string) {
    return this.osService.findAll(tenantId, status);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.osService.findById(id, tenantId);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateServiceOrderSchema)) body: CreateServiceOrderDto
  ) {
    return this.osService.create(tenantId, body);
  }

  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any
  ) {
    return this.osService.start(id, tenantId, user?.userId || 'system');
  }

  @Post(':id/photos')
  async uploadPhotos(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(UploadPhotosSchema)) body: UploadPhotosDto
  ) {
    return this.osService.uploadPhotos(id, tenantId, body);
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CompleteServiceOrderSchema)) body: CompleteServiceOrderDto
  ) {
    return this.osService.complete(id, tenantId, body);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CancelServiceOrderSchema)) body: CancelServiceOrderDto
  ) {
    return this.osService.cancel(id, tenantId, body);
  }
}
