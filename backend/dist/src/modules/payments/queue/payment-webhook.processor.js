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
exports.PaymentWebhookProcessor = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../payment.service");
/**
 * Mock para a Fila do BullMQ
 * Em produção teríamos algo como:
 * @Processor('webhook-queue')
 * export class WebhookProcessor extends WorkerHost
 */
let PaymentWebhookProcessor = class PaymentWebhookProcessor {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    // Simula a injeção assíncrona na fila com retries (1s, 5s, 30s)
    async enqueueWebhookPayload(paymentId, status, tenantId) {
        const retries = [1000, 5000, 30000];
        let attempt = 0;
        const process = async () => {
            try {
                await this.paymentService.handleWebhookAction(paymentId, status, tenantId);
                console.log(`[BULL-MOCK] Job de webhook executado com sucesso para payment ${paymentId}`);
            }
            catch (error) {
                if (attempt < retries.length) {
                    console.log(`[BULL-MOCK] Falha ao processar webhook. Tentando novamente em ${retries[attempt]}ms (tentativa ${attempt + 1})`);
                    setTimeout(process, retries[attempt]);
                    attempt++;
                }
                else {
                    console.error(`[BULL-MOCK] Job falhou definitivamente após ${retries.length} tentativas para payment ${paymentId}`);
                }
            }
        };
        // Joga pra callstack paralela
        setTimeout(process, 100);
    }
};
exports.PaymentWebhookProcessor = PaymentWebhookProcessor;
exports.PaymentWebhookProcessor = PaymentWebhookProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentWebhookProcessor);
