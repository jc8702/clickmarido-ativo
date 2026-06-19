"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationApprovedEvent = exports.QuotationCreatedEvent = void 0;
class QuotationCreatedEvent {
    quotationId;
    tenantId;
    customerId;
    total;
    constructor(quotationId, tenantId, customerId, total) {
        this.quotationId = quotationId;
        this.tenantId = tenantId;
        this.customerId = customerId;
        this.total = total;
    }
}
exports.QuotationCreatedEvent = QuotationCreatedEvent;
class QuotationApprovedEvent {
    quotationId;
    tenantId;
    customerId;
    items;
    total;
    constructor(quotationId, tenantId, customerId, items, total) {
        this.quotationId = quotationId;
        this.tenantId = tenantId;
        this.customerId = customerId;
        this.items = items;
        this.total = total;
    }
}
exports.QuotationApprovedEvent = QuotationApprovedEvent;
