import { Module, Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
import { AfterSalesListener } from '../after-sales/after-sales.listener';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimWarrantyDto, SubmitFeedbackDto } from './dto/warranties.dto';

@Controller('warranties')
export class WarrantiesController {
  constructor(
    private readonly warrantiesService: WarrantiesService,
    private readonly afterSalesService: AfterSalesService,
  ) {}

  @Get()
  async getActiveWarranties(@Query('tenantId') tenantId: string) {
    return this.warrantiesService.findActive(tenantId || 'tenant-123');
  }

  @Post(':id/claim')
  async claim(@Param('id') id: string, @Body() dto: ClaimWarrantyDto, @Query('tenantId') tenantId: string) {
    return this.warrantiesService.claimWarranty(id, tenantId || 'tenant-123', dto.description);
  }

  @Post('feedback')
  async submitFeedback(@Query('token') token: string, @Body() dto: SubmitFeedbackDto) {
    return this.afterSalesService.submitFeedback(token, dto.rating, dto.nps, dto.feedbackText);
  }
}

@Module({
  imports: [NotificationsModule],
  controllers: [WarrantiesController],
  providers: [
    WarrantiesService,
    AfterSalesService,
    AfterSalesListener,
  ],
  exports: [WarrantiesService, AfterSalesService],
})
export class WarrantiesModule {}
