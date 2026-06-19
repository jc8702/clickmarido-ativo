"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const notification_queue_1 = require("./queue/notification.queue");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    queue;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(queue) {
        this.queue = queue;
    }
    async sendQuotationReminder(quotationId, clientPhone) {
        const notificationId = `quotation_reminder_${quotationId}`;
        this.logger.log(`Enfileirando lembrete de orçamento para Quotation ${quotationId}`);
        return this.queue.add('sms_job', {
            to: clientPhone,
            message: `Olá! Seu orçamento #${quotationId} está aguardando aprovação. Clique no link para aprovar.`,
            notification_id: notificationId,
        });
    }
    async sendServiceOrderConfirmation(serviceOrderId, clientPhone, technicianPhone) {
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
    async sendServiceOrderReminder(serviceOrderId, technicianPhone) {
        const notificationId = `so_reminder_tech_${serviceOrderId}`;
        this.logger.log(`Enfileirando lembrete de 1h antes para SO ${serviceOrderId}`);
        return this.queue.add('sms_job', {
            to: technicianPhone,
            message: `Lembrete: Você tem uma Ordem de Serviço #${serviceOrderId} agendada para daqui a 1 hora.`,
            notification_id: notificationId,
        });
    }
    async sendPaymentApproved(paymentId, clientPhone) {
        const notificationId = `payment_approved_${paymentId}`;
        this.logger.log(`Enfileirando confirmação de pagamento para Payment ${paymentId}`);
        return this.queue.add('whatsapp_job', {
            to: clientPhone,
            message: `Seu pagamento #${paymentId} foi aprovado com sucesso! Obrigado pela preferência.`,
            notification_id: notificationId,
        });
    }
    async sendAfterSalesFollowUp(afterSalesId, clientPhone) {
        const notificationId = `after_sales_${afterSalesId}`;
        this.logger.log(`Enfileirando formulário pós-vendas para AfterSales ${afterSalesId}`);
        return this.queue.add('whatsapp_job', {
            to: clientPhone,
            message: `Olá! Gostaríamos de saber como foi sua experiência. Responda nosso formulário: https://clickmarido.com/form/${afterSalesId}`,
            notification_id: notificationId,
        });
    }
    // Métodos auxiliares para escuta direta
    async sendQuotationCreated(quotationId, clientPhone) {
        const notificationId = `quotation_created_${quotationId}`;
        return this.queue.add('sms_job', {
            to: clientPhone,
            message: `Seu orçamento #${quotationId} foi gerado. Acesse seu e-mail para visualizar.`,
            notification_id: notificationId,
        });
    }
    async sendQuotationSent(quotationId, clientEmail) {
        const notificationId = `quotation_sent_${quotationId}`;
        return this.queue.add('email_job', {
            to: clientEmail,
            subject: `Seu Orçamento ClickMarido #${quotationId}`,
            body: `Olá! Seu orçamento foi gerado com sucesso. Acesse o portal para aprovar.`,
            notification_id: notificationId,
        });
    }
    async sendServiceOrderStarted(serviceOrderId, clientPhone) {
        const notificationId = `so_started_${serviceOrderId}`;
        return this.queue.add('whatsapp_job', {
            to: clientPhone,
            message: `O técnico iniciou a execução da sua OS #${serviceOrderId}. Acompanhe pelo app.`,
            notification_id: notificationId,
        });
    }
    async sendServiceOrderCompleted(serviceOrderId, clientEmail, clientPhone) {
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_queue_1.NotificationQueue])
], NotificationsService);
