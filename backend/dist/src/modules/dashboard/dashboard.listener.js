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
var DashboardListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const dashboard_service_1 = require("./dashboard.service");
let DashboardListener = DashboardListener_1 = class DashboardListener {
    dashboardService;
    logger = new common_1.Logger(DashboardListener_1.name);
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    handleServiceOrderCompleted(event) {
        this.logger.log(`[Event Listener] Invalidando cache do Dashboard por conclusão de OS no tenant ${event.tenantId}`);
        this.dashboardService.invalidateCache(event.tenantId);
    }
    handleServiceOrderScheduled(event) {
        this.logger.log(`[Event Listener] Invalidando cache do Dashboard por agendamento de OS no tenant ${event.tenantId}`);
        this.dashboardService.invalidateCache(event.tenantId);
    }
    handlePaymentApproved(event) {
        this.logger.log(`[Event Listener] Invalidando cache do Dashboard por aprovação de pagamento no tenant ${event.tenantId}`);
        this.dashboardService.invalidateCache(event.tenantId);
    }
};
exports.DashboardListener = DashboardListener;
__decorate([
    (0, event_emitter_1.OnEvent)('service-order.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardListener.prototype, "handleServiceOrderCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('service-order.scheduled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardListener.prototype, "handleServiceOrderScheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('payment.approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardListener.prototype, "handlePaymentApproved", null);
exports.DashboardListener = DashboardListener = DashboardListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardListener);
