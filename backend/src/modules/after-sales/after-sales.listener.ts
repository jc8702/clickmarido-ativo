import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WarrantiesService } from '../warranties/warranties.service';
import { AfterSalesService } from './after-sales.service';

@Injectable()
export class AfterSalesListener {
  private readonly logger = new Logger(AfterSalesListener.name);

  constructor(
    private readonly warrantiesService: WarrantiesService,
    private readonly afterSalesService: AfterSalesService,
  ) {}

  @OnEvent('payment.approved')
  async handlePaymentApproved(event: { id: string; serviceOrderId: string; tenantId: string }) {
    this.logger.log(`[Event Listener] Escutou payment.approved. Criando garantia e agendando pós-venda para SO: ${event.serviceOrderId}`);

    // 1. Cria garantia ativa
    await this.warrantiesService.createFromServiceOrder(event.tenantId, event.serviceOrderId);

    // 2. Agenda pós-venda (+7 dias)
    await this.afterSalesService.schedule(event.tenantId, event.serviceOrderId);
  }
}
