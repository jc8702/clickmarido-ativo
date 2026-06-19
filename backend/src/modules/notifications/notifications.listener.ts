import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('quotation.created')
  async handleQuotationCreated(event: { id: string; clientPhone: string }) {
    this.logger.log(`[Event Listener] Escutou quotation.created para ID ${event.id}`);
    await this.notificationsService.sendQuotationCreated(event.id, event.clientPhone);
  }

  @OnEvent('quotation.sent')
  async handleQuotationSent(event: { id: string; clientEmail: string }) {
    this.logger.log(`[Event Listener] Escutou quotation.sent para ID ${event.id}`);
    await this.notificationsService.sendQuotationSent(event.id, event.clientEmail);
  }

  @OnEvent('service-order.scheduled')
  async handleServiceOrderScheduled(event: { id: string; clientPhone: string; technicianPhone: string }) {
    this.logger.log(`[Event Listener] Escutou service-order.scheduled para ID ${event.id}`);
    await this.notificationsService.sendServiceOrderConfirmation(event.id, event.clientPhone, event.technicianPhone);
  }

  @OnEvent('service-order.started')
  async handleServiceOrderStarted(event: { id: string; clientPhone: string }) {
    this.logger.log(`[Event Listener] Escutou service-order.started para ID ${event.id}`);
    await this.notificationsService.sendServiceOrderStarted(event.id, event.clientPhone);
  }

  @OnEvent('service-order.completed')
  async handleServiceOrderCompleted(event: { id: string; clientEmail: string; clientPhone: string }) {
    this.logger.log(`[Event Listener] Escutou service-order.completed para ID ${event.id}`);
    await this.notificationsService.sendServiceOrderCompleted(event.id, event.clientEmail, event.clientPhone);
  }

  @OnEvent('payment.approved')
  async handlePaymentApproved(event: { id: string; clientPhone: string }) {
    this.logger.log(`[Event Listener] Escutou payment.approved para ID ${event.id}`);
    await this.notificationsService.sendPaymentApproved(event.id, event.clientPhone);
  }
}
