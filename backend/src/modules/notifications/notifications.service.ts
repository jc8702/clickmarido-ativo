import { Injectable, Logger } from '@nestjs/common';
import { NotificationQueue } from './queue/notification.queue';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly queue: NotificationQueue) {}

  async sendQuotationReminder(quotationId: string, clientPhone: string) {
    const notificationId = `quotation_reminder_${quotationId}`;
    this.logger.log(`Enfileirando lembrete de orçamento para Quotation ${quotationId}`);

    return this.queue.add('sms_job', {
      to: clientPhone,
      message: `Olá! Seu orçamento #${quotationId} está aguardando aprovação. Clique no link para aprovar.`,
      notification_id: notificationId,
    });
  }

  async sendServiceOrderConfirmation(serviceOrderId: string, clientPhone: string, technicianPhone: string) {
    // SMS Cliente
    const clientNotifId = `so_confirm_client_${serviceOrderId}`;
    await this.queue.add('sms_job', {
      to: clientPhone,
      message: `Sua Ordem de Serviço #${serviceOrderId} foi agendada com sucesso!`,
      notification_id: clientNotifId,
    });

    // SMS Técnico
    const techNotifId = `so_confirm_tech_${serviceOrderId}`;
    await this.queue.add('sms_job', {
      to: technicianPhone,
      message: `Nova Ordem de Serviço #${serviceOrderId} agendada para você. Verifique os detalhes.`,
      notification_id: techNotifId,
    });
  }

  async sendServiceOrderReminder(serviceOrderId: string, technicianPhone: string) {
    const notificationId = `so_reminder_tech_${serviceOrderId}`;
    this.logger.log(`Enfileirando lembrete de 1h antes para SO ${serviceOrderId}`);

    return this.queue.add('sms_job', {
      to: technicianPhone,
      message: `Lembrete: Você tem uma Ordem de Serviço #${serviceOrderId} agendada para daqui a 1 hora.`,
      notification_id: notificationId,
    });
  }

  async sendPaymentApproved(paymentId: string, clientPhone: string) {
    const notificationId = `payment_approved_${paymentId}`;
    this.logger.log(`Enfileirando confirmação de pagamento para Payment ${paymentId}`);

    return this.queue.add('whatsapp_job', {
      to: clientPhone,
      message: `Seu pagamento #${paymentId} foi aprovado com sucesso! Obrigado pela preferência.`,
      notification_id: notificationId,
    });
  }

  async sendAfterSalesFollowUp(afterSalesId: string, clientPhone: string) {
    const notificationId = `after_sales_${afterSalesId}`;
    this.logger.log(`Enfileirando formulário pós-vendas para AfterSales ${afterSalesId}`);

    return this.queue.add('whatsapp_job', {
      to: clientPhone,
      message: `Olá! Gostaríamos de saber como foi sua experiência. Responda nosso formulário: https://clickmarido.com/form/${afterSalesId}`,
      notification_id: notificationId,
    });
  }

  // Métodos auxiliares para escuta direta
  async sendQuotationCreated(quotationId: string, clientPhone: string) {
    const notificationId = `quotation_created_${quotationId}`;
    return this.queue.add('sms_job', {
      to: clientPhone,
      message: `Seu orçamento #${quotationId} foi gerado. Acesse seu e-mail para visualizar.`,
      notification_id: notificationId,
    });
  }

  async sendQuotationSent(quotationId: string, clientEmail: string) {
    const notificationId = `quotation_sent_${quotationId}`;
    return this.queue.add('email_job', {
      to: clientEmail,
      subject: `Seu Orçamento ClickMarido #${quotationId}`,
      body: `Olá! Seu orçamento foi gerado com sucesso. Acesse o portal para aprovar.`,
      notification_id: notificationId,
    });
  }

  async sendServiceOrderStarted(serviceOrderId: string, clientPhone: string) {
    const notificationId = `so_started_${serviceOrderId}`;
    return this.queue.add('whatsapp_job', {
      to: clientPhone,
      message: `O técnico iniciou a execução da sua OS #${serviceOrderId}. Acompanhe pelo app.`,
      notification_id: notificationId,
    });
  }

  async sendServiceOrderCompleted(serviceOrderId: string, clientEmail: string, clientPhone: string) {
    const notificationIdEmail = `so_completed_email_${serviceOrderId}`;
    const notificationIdSms = `so_completed_sms_${serviceOrderId}`;

    await this.queue.add('email_job', {
      to: clientEmail,
      subject: `Serviço Concluído #${serviceOrderId}`,
      body: `Sua OS #${serviceOrderId} foi finalizada pelo técnico. Agradecemos a confiança!`,
      notification_id: notificationIdEmail,
    });

    await this.queue.add('sms_job', {
      to: clientPhone,
      message: `Sua OS #${serviceOrderId} foi concluída. Um e-mail com a nota fiscal e detalhes foi enviado.`,
      notification_id: notificationIdSms,
    });
  }
}
