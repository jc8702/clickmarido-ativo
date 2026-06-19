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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfterSalesService = exports.afterSalesDb = void 0;
const common_1 = require("@nestjs/common");
const notification_queue_1 = require("../notifications/queue/notification.queue");
exports.afterSalesDb = [];
let AfterSalesService = class AfterSalesService {
    notificationQueue;
    constructor(notificationQueue) {
        this.notificationQueue = notificationQueue;
    }
    async schedule(tenantId, serviceOrderId) {
        const afterSalesId = `as_${Math.random().toString(36).substring(7)}`;
        const token = `token_${Math.random().toString(36).substring(10)}`;
        const record = {
            id: afterSalesId,
            tenantId,
            service_order_id: serviceOrderId,
            contact_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
            token,
        };
        exports.afterSalesDb.push(record);
        // Agenda um job no nosso NotificationQueue simulando a fila Bull
        await this.notificationQueue.add('whatsapp_job', {
            to: '+5511999999999', // telefone cliente mock
            message: `Como foi seu atendimento no serviço #${serviceOrderId}? Responda em: https://clickmarido.com/after-sales-form?token=${token}`,
            notification_id: `after_sales_whatsapp_${afterSalesId}`,
        });
        return record;
    }
    async sendFollowUp(afterSalesId) {
        const record = exports.afterSalesDb.find(a => a.id === afterSalesId);
        if (!record)
            throw new common_1.NotFoundException('Registro de pós-venda não encontrado');
        console.log(`[WHATSAPP AFTER SALES] Enviando link NPS do token ${record.token} ao cliente`);
        return { success: true };
    }
    async submitFeedback(token, rating, nps, feedback) {
        const record = exports.afterSalesDb.find(a => a.token === token);
        if (!record)
            throw new common_1.NotFoundException('Token pós-venda inválido');
        record.satisfaction_rating = rating;
        record.nps_score = nps;
        record.feedback_text = feedback;
        // Escalação e tratamento automático de críticas (Rating < 4)
        if (rating < 4) {
            record.problem_identified = true;
            record.action_required = 'Gerente acionado para agendamento de ajuste grátis';
            console.warn(`[NPS ALERT] Nota baixa recebida (${rating}/5). Alerta enviado ao Admin!`);
            // Simula a criação automática de uma nova OS ou Ticket de suporte
        }
        else {
            record.problem_identified = false;
            console.log(`[NPS SUCCESS] Excelente avaliação recebida: ${rating}/5.`);
        }
        return record;
    }
    async clear() {
        exports.afterSalesDb = [];
    }
};
exports.AfterSalesService = AfterSalesService;
exports.AfterSalesService = AfterSalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_queue_1.NotificationQueue])
], AfterSalesService);
