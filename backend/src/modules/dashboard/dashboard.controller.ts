import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Query('tenantId') tenantId: string) {
    return this.dashboardService.getOverview(tenantId || 'tenant-123');
  }

  @Get('revenue-trend')
  async getRevenueTrend(@Query('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.dashboardService.getRevenueTrend(tenantId || 'tenant-123', months ? Number(months) : 12);
  }

  @Get('payment-methods')
  async getPaymentMethods(@Query('tenantId') tenantId: string) {
    return this.dashboardService.getPaymentMethods(tenantId || 'tenant-123');
  }

  @Get('top-services')
  async getTopServices(@Query('tenantId') tenantId: string, @Query('limit') limit?: number) {
    return this.dashboardService.getTopServices(tenantId || 'tenant-123', limit ? Number(limit) : 5);
  }
}
