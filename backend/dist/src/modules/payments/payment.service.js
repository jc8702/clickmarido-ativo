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
exports.PaymentService = exports.paymentsDb = void 0;
const common_1 = require("@nestjs/common");
const mercadopago_provider_1 = require("./providers/mercadopago.provider");
// DB Mock
exports.paymentsDb = [];
let PaymentService = class PaymentService {
    mpProvider;
    constructor(mpProvider) {
        this.mpProvider = mpProvider;
    }
    async create(tenantId, dto) {
        // Chamaria o MP Provider
        const { preference_id, init_point, qr_code } = await this.mpProvider.createPreference(dto.amount, `Serviço OS: ${dto.serviceOrderId}`, 'customer-mock-id', dto.serviceOrderId);
        const payment = {
            id: Math.random().toString(36).substring(7),
            tenantId,
            service_order_id: dto.serviceOrderId,
            amount: dto.amount,
            payment_method: dto.method,
            status: 'pending',
            mercadopago_payment_id: preference_id,
            mercadopago_qr_code: qr_code,
            init_point,
            paid_at: null,
            created_at: new Date()
        };
        exports.paymentsDb.push(payment);
        console.log(`[NOTIFICAÇÃO MOCK] E-mail enviado com QR Code PIX para a OS ${dto.serviceOrderId}`);
        return {
            id: payment.id,
            qr_code,
            init_point,
            status: payment.status
        };
    }
    async getPaymentStatus(id, tenantId) {
        const payment = exports.paymentsDb.find(p => p.id === id && p.tenantId === tenantId);
        if (!payment)
            throw new common_1.NotFoundException('Pagamento não localizado');
        return payment;
    }
    // O handler que é executado na Fila
    async handleWebhookAction(mercadopagoPaymentId, status, tenantId) {
        const payment = exports.paymentsDb.find(p => p.mercadopago_payment_id === mercadopagoPaymentId);
        if (!payment) {
            throw new Error(`Payment com preference ${mercadopagoPaymentId} não encontrado no banco`);
        }
        if (status === 'approved') {
            payment.status = 'aprovado';
            payment.paid_at = new Date();
            console.log(`[NOTIFICAÇÃO MOCK] WhatsApp Cliente: Pagamento Aprovado! OS: ${payment.service_order_id}`);
            // Lógica de after sales agendamento poderia ser disparada aqui
            console.log(`[EVENTO MOCK] After-sales scheduled para +7 dias.`);
        }
        else if (status === 'rejected') {
            payment.status = 'rejeitado';
            console.log(`[NOTIFICAÇÃO MOCK] SMS Cliente: Pagamento recusado para OS: ${payment.service_order_id}`);
        }
    }
    async refund(id, tenantId, dto) {
        const payment = await this.getPaymentStatus(id, tenantId);
        if (payment.status !== 'aprovado') {
            throw new Error('Apenas pagamentos aprovados podem ser estornados');
        }
        const refundRes = await this.mpProvider.refund(payment.mercadopago_payment_id, dto.amount);
        payment.status = 'reembolsado';
        payment.refund_amount = refundRes.amount_refunded;
        return payment;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mercadopago_provider_1.MercadopagoProvider])
], PaymentService);
