import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDto, CustomerSchema, AddressDto, AddressSchema } from './dto/customer.dto';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { JwtGuard } from '../../shared/guards/jwt.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { z } from 'zod';

const PartialCustomerSchema = CustomerSchema.partial();

@Controller('customers')
@UseGuards(TenantGuard, JwtGuard) // Protegido pelo RLS nativo do framework/BD simulado
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string
  ) {
    return this.customersService.findAll(tenantId, Number(page) || 1, Number(limit) || 10, search);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.customersService.findById(id, tenantId);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CustomerSchema)) body: CustomerDto
  ) {
    return this.customersService.create(tenantId, user?.userId || 'system', body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(PartialCustomerSchema)) body: Partial<CustomerDto>
  ) {
    return this.customersService.update(id, tenantId, user?.userId || 'system', body);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any
  ) {
    return this.customersService.delete(id, tenantId, user?.userId || 'system');
  }

  @Post(':id/addresses')
  async addAddress(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(AddressSchema)) body: AddressDto
  ) {
    return this.customersService.addAddress(id, tenantId, body);
  }

  @Delete(':id/addresses/:addressId')
  async removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.customersService.removeAddress(id, addressId, tenantId);
  }
}
