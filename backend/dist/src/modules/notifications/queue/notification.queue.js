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
var NotificationQueue_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationQueue = void 0;
const common_1 = require("@nestjs/common");
const twilio_sms_provider_1 = require("../providers/twilio-sms.provider");
const twilio_whatsapp_provider_1 = require("../providers/twilio-whatsapp.provider");
const resend_email_provider_1 = require("../providers/resend-email.provider");
let NotificationQueue = NotificationQueue_1 = class NotificationQueue {
    smsProvider;
    whatsappProvider;
    emailProvider;
    logger = new common_1.Logger(NotificationQueue_1.name);
    // Banco de dados em memória para simular o Redis/Bull
    jobs = new Map();
    dlq = [];
    processedNotifications = new Set(); // Controle de idempotência
    // Backoffs configurados: [1s, 5s, 30s] (convertidos em ms para o setTimeout)
    backoffTimes = [1000, 5000, 30000];
    constructor(smsProvider, whatsappProvider, emailProvider) {
        this.smsProvider = smsProvider;
        this.whatsappProvider = whatsappProvider;
        this.emailProvider = emailProvider;
    }
    async add(type, data) {
        const notificationId = data.notification_id;
        // 1. Verificação de idempotência
        if (notificationId && this.processedNotifications.has(notificationId)) {
            this.logger.warn(`[IDEMPOTÊNCIA] Job com notification_id ${notificationId} já foi processado/ignorado.`);
            return { success: true, duplicate: true };
        }
        const jobId = `job_${Math.random().toString(36).substring(7)}`;
        const newJob = {
            id: jobId,
            type,
            data,
            attempts: 0,
            maxAttempts: 3,
            status: 'pending',
            errorHistory: [],
        };
        this.jobs.set(jobId, newJob);
        this.logger.log(`Job ${jobId} do tipo ${type} enfileirado com sucesso.`);
        // Inicia processamento assíncrono (não-bloqueante, emula Bull)
        this.processJob(jobId);
        return { success: true, jobId };
    }
    async processJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.status = 'processing';
        job.attempts++;
        try {
            let result;
            switch (job.type) {
                case 'sms_job':
                    result = await this.smsProvider.sendSms(job.data.to, job.data.message);
                    break;
                case 'whatsapp_job':
                    result = await this.whatsappProvider.sendWhatsApp(job.data.to, job.data.message);
                    break;
                case 'email_job':
                    result = await this.emailProvider.sendEmail(job.data.to, job.data.subject, job.data.body);
                    break;
            }
            if (result.success) {
                job.status = 'completed';
                if (job.data.notification_id) {
                    this.processedNotifications.add(job.data.notification_id);
                }
                this.logger.log(`[Job Success] Job ${job.id} concluído na tentativa ${job.attempts}`);
            }
            else {
                throw new Error(result.error || 'Erro desconhecido no provedor');
            }
        }
        catch (err) {
            const errorMsg = err.message || String(err);
            job.errorHistory.push(errorMsg);
            this.logger.error(`[Job Failure] Tentativa ${job.attempts}/${job.maxAttempts} falhou para o Job ${job.id}. Erro: ${errorMsg}`);
            if (job.attempts < job.maxAttempts) {
                job.status = 'pending';
                const delay = this.backoffTimes[job.attempts - 1] || 1000;
                this.logger.warn(`Agendando nova tentativa para o Job ${job.id} em ${delay}ms`);
                setTimeout(() => this.processJob(jobId), delay);
            }
            else {
                job.status = 'failed';
                this.dlq.push(job);
                this.logger.error(`[DLQ] Job ${job.id} excedeu o limite de tentativas e foi movido para a Dead Letter Queue (DLQ). Alerta admin!`);
            }
        }
    }
    async getFailedCount() {
        return this.dlq.length;
    }
    async getDlq() {
        return this.dlq;
    }
    async clearDlq() {
        this.dlq = [];
    }
    async getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        return job ? job.status : null;
    }
};
exports.NotificationQueue = NotificationQueue;
exports.NotificationQueue = NotificationQueue = NotificationQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [twilio_sms_provider_1.TwilioSmsProvider,
        twilio_whatsapp_provider_1.TwilioWhatsAppProvider,
        resend_email_provider_1.ResendEmailProvider])
], NotificationQueue);
