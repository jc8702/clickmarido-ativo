import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DashboardService } from './dashboard.service';

@Injectable()
export class DashboardListener {
  private readonly logger = new Logger(DashboardListener.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @OnEvent('service-order.completed')
  handleServiceOrderCompleted(event: { tenantId: string }) {
    this.logger.log(`[Event Listener] Invalidando cache do Dashboard por conclusão de OS no tenant ${event.tenantId}`);
    this.dashboardService.invalidateCache(event.tenantId);
  }

  @OnEvent('service-order.scheduled')
  handleServiceOrderScheduled(event: { tenantId: string }) {
    this.logger.log(`[Event Listener] Invalidando cache do Dashboard por agendamento de OS no tenant ${event.tenantId}`);
    this.dashboardService.invalidateCache(event.tenantId);
  }

  @OnEvent('payment.approved')
  handlePaymentApproved(event: { tenantId: string }) {
    this.logger.log(`[Event Listener] Invalidando cache do Dashboard por aprovação de pagamento no tenant ${event.tenantId}`);
    this.dashboardService.invalidateCache(event.tenantId);
  }
}
