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
var AfterSalesListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfterSalesListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const warranties_service_1 = require("../warranties/warranties.service");
const after_sales_service_1 = require("./after-sales.service");
let AfterSalesListener = AfterSalesListener_1 = class AfterSalesListener {
    warrantiesService;
    afterSalesService;
    logger = new common_1.Logger(AfterSalesListener_1.name);
    constructor(warrantiesService, afterSalesService) {
        this.warrantiesService = warrantiesService;
        this.afterSalesService = afterSalesService;
    }
    async handlePaymentApproved(event) {
        this.logger.log(`[Event Listener] Escutou payment.approved. Criando garantia e agendando pós-venda para SO: ${event.serviceOrderId}`);
        // 1. Cria garantia ativa
        await this.warrantiesService.createFromServiceOrder(event.tenantId, event.serviceOrderId);
        // 2. Agenda pós-venda (+7 dias)
        await this.afterSalesService.schedule(event.tenantId, event.serviceOrderId);
    }
};
exports.AfterSalesListener = AfterSalesListener;
__decorate([
    (0, event_emitter_1.OnEvent)('payment.approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AfterSalesListener.prototype, "handlePaymentApproved", null);
exports.AfterSalesListener = AfterSalesListener = AfterSalesListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [warranties_service_1.WarrantiesService,
        after_sales_service_1.AfterSalesService])
], AfterSalesListener);
