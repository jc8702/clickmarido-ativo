import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationDto, QuotationSchema } from './dto/quotation.dto';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { JwtGuard } from '../../shared/guards/jwt.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';

const PartialQuotationSchema = QuotationSchema.partial();

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  // PÚBLICO: Não possui Guards
  @Get('public/:token')
  async getPublicView(@Param('token') token: string) {
    return this.quotationsService.getPublicView(token);
  }

  // PÚBLICO: Não possui Guards
  @Post('public/:token/approve')
  async approveByCustomer(@Param('token') token: string) {
    return this.quotationsService.approveByCustomer(token);
  }

  // PROTEGIDAS
  @UseGuards(TenantGuard, JwtGuard)
  @Get()
  async findAll(@CurrentTenant() tenantId: string, @Query('status') status: string) {
    return this.quotationsService.findAll(tenantId, status);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Get(':id')
  async findById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.quotationsService.findById(id, tenantId);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(QuotationSchema)) body: QuotationDto
  ) {
    return this.quotationsService.create(tenantId, user?.userId || 'system', body);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(PartialQuotationSchema)) body: Partial<QuotationDto>
  ) {
    return this.quotationsService.update(id, tenantId, body);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Post(':id/send')
  async send(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body('method') method: 'email' | 'whatsapp'
  ) {
    return this.quotationsService.send(id, tenantId, method || 'whatsapp');
  }
}
