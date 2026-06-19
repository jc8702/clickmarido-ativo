import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardListener } from './dashboard.listener';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardListener],
  exports: [DashboardService],
})
export class DashboardModule {}
