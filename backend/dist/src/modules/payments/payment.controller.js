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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_webhook_processor_1 = require("./queue/payment-webhook.processor");
const mercadopago_provider_1 = require("./providers/mercadopago.provider");
const payment_dto_1 = require("./dto/payment.dto");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const jwt_guard_1 = require("../../shared/guards/jwt.guard");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const zod_validation_pipe_1 = require("../../shared/pipes/zod-validation.pipe");
let PaymentController = class PaymentController {
    paymentService;
    webhookProcessor;
    mpProvider;
    constructor(paymentService, webhookProcessor, mpProvider) {
        this.paymentService = paymentService;
        this.webhookProcessor = webhookProcessor;
        this.mpProvider = mpProvider;
    }
    // ==========================================
    // Rotas Privadas
    // ==========================================
    async create(tenantId, body) {
        return this.paymentService.create(tenantId, body);
    }
    async getStatus(id, tenantId) {
        return this.paymentService.getPaymentStatus(id, tenantId);
    }
    async refund(id, tenantId, body) {
        return this.paymentService.refund(id, tenantId, body);
    }
    // ==========================================
    // Webhook (Público, Validado por HMAC)
    // ==========================================
    async handleWebhook(xSignature, xRequestId, body) {
        // 1. Validação Criptográfica Pura do Webhook
        const dataId = body?.data?.id || '';
        const isValid = this.mpProvider.validateWebhookSignature(xSignature, xRequestId, dataId);
        if (!isValid) {
            console.warn(`[WEBHOOK BLOCK] Assinatura inválida detectada! reqId: ${xRequestId}`);
            throw new common_1.HttpException('Assinatura HMAC inválida', common_1.HttpStatus.FORBIDDEN);
        }
        // 2. Extração dos dados
        const action = body?.action; // 'payment.created', 'payment.updated'
        const status = body?.data?.status; // 'approved', 'rejected'
        const paymentId = body?.data?.id; // ID do MP
        // MP envia vários tipos, focamos em update de payment
        if (action?.includes('payment') && status) {
            // 3. Joga na Fila para não segurar o MP
            // (TenantId seria deduzido consultando o banco pelo paymentId, usando mock-tenant aqui)
            await this.webhookProcessor.enqueueWebhookPayload(paymentId, status, 'tenant-a-123');
        }
        // MP exige retorno 200/201 super rápido (<2s)
        return { received: true };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Post)('payments'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(payment_dto_1.CreatePaymentSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof payment_dto_1.CreatePaymentDto !== "undefined" && payment_dto_1.CreatePaymentDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Get)('payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getStatus", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Post)('payments/:id/refund'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(payment_dto_1.RefundPaymentSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_b = typeof payment_dto_1.RefundPaymentDto !== "undefined" && payment_dto_1.RefundPaymentDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "refund", null);
__decorate([
    (0, common_1.Post)('webhooks/mercadopago'),
    __param(0, (0, common_1.Headers)('x-signature')),
    __param(1, (0, common_1.Headers)('x-request-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        payment_webhook_processor_1.PaymentWebhookProcessor,
        mercadopago_provider_1.MercadopagoProvider])
], PaymentController);
