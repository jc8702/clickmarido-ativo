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
var NotificationsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notifications_service_1 = require("./notifications.service");
let NotificationsListener = NotificationsListener_1 = class NotificationsListener {
    notificationsService;
    logger = new common_1.Logger(NotificationsListener_1.name);
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async handleQuotationCreated(event) {
        this.logger.log(`[Event Listener] Escutou quotation.created para ID ${event.id}`);
        await this.notificationsService.sendQuotationCreated(event.id, event.clientPhone);
    }
    async handleQuotationSent(event) {
        this.logger.log(`[Event Listener] Escutou quotation.sent para ID ${event.id}`);
        await this.notificationsService.sendQuotationSent(event.id, event.clientEmail);
    }
    async handleServiceOrderScheduled(event) {
        this.logger.log(`[Event Listener] Escutou service-order.scheduled para ID ${event.id}`);
        await this.notificationsService.sendServiceOrderConfirmation(event.id, event.clientPhone, event.technicianPhone);
    }
    async handleServiceOrderStarted(event) {
        this.logger.log(`[Event Listener] Escutou service-order.started para ID ${event.id}`);
        await this.notificationsService.sendServiceOrderStarted(event.id, event.clientPhone);
    }
    async handleServiceOrderCompleted(event) {
        this.logger.log(`[Event Listener] Escutou service-order.completed para ID ${event.id}`);
        await this.notificationsService.sendServiceOrderCompleted(event.id, event.clientEmail, event.clientPhone);
    }
    async handlePaymentApproved(event) {
        this.logger.log(`[Event Listener] Escutou payment.approved para ID ${event.id}`);
        await this.notificationsService.sendPaymentApproved(event.id, event.clientPhone);
    }
};
exports.NotificationsListener = NotificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('quotation.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleQuotationCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('quotation.sent'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleQuotationSent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('service-order.scheduled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleServiceOrderScheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('service-order.started'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleServiceOrderStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('service-order.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handleServiceOrderCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('payment.approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "handlePaymentApproved", null);
exports.NotificationsListener = NotificationsListener = NotificationsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsListener);
