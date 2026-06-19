"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const quotation_events_1 = require("./events/quotation.events");
// In-memory mock replacing DB
let quotationsDb = [];
let seqGlobal = 1000;
let QuotationsService = class QuotationsService {
    // Emulates an Event Emitter
    emitEvent(eventName, payload) {
        console.log(`[EVENT EMITTED] ${eventName}:`, payload);
        if (eventName === 'quotation.approved') {
            console.log(`[MOCK] ServiceOrder automatically created for quotation ${payload.quotationId}`);
        }
    }
    async findAll(tenantId, status) {
        let filtered = quotationsDb.filter(q => q.tenantId === tenantId);
        if (status) {
            filtered = filtered.filter(q => q.status === status);
        }
        return filtered;
    }
    async findById(id, tenantId) {
        const q = quotationsDb.find(q => q.id === id && q.tenantId === tenantId);
        if (!q)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        return q;
    }
    async create(tenantId, userId, dto) {
        const subtotal = dto.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        const total = subtotal - (dto.discount || 0);
        if (total <= 0)
            throw new common_1.BadRequestException('Total deve ser maior que zero');
        seqGlobal++;
        const newQuotation = {
            id: Math.random().toString(36).substring(7),
            number: `ORC-${seqGlobal}`,
            tenantId,
            created_by: userId,
            customer_id: dto.customer_id,
            items: dto.items,
            subtotal,
            discount: dto.discount,
            total,
            status: 'draft',
            valid_until: new Date(dto.valid_until),
            approval_link: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
            created_at: new Date(),
        };
        quotationsDb.push(newQuotation);
        this.emitEvent('quotation.created', new quotation_events_1.QuotationCreatedEvent(newQuotation.id, tenantId, newQuotation.customer_id, newQuotation.total));
        return newQuotation;
    }
    async update(id, tenantId, dto) {
        const q = await this.findById(id, tenantId);
        if (q.status !== 'draft') {
            throw new common_1.BadRequestException('Apenas orçamentos em rascunho podem ser alterados');
        }
        if (dto.items) {
            q.items = dto.items;
            q.subtotal = q.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        }
        if (dto.discount !== undefined)
            q.discount = dto.discount;
        q.total = q.subtotal - (q.discount || 0);
        if (dto.valid_until)
            q.valid_until = new Date(dto.valid_until);
        return q;
    }
    async send(id, tenantId, method) {
        const q = await this.findById(id, tenantId);
        if (q.status === 'approved' || q.status === 'rejected' || q.status === 'expired') {
            throw new common_1.BadRequestException('Este orçamento já está finalizado');
        }
        q.status = 'sent';
        console.log(`[MOCK] Orçamento ${q.number} enviado via ${method}. Link: /quotations/view?token=${q.approval_link}`);
        return { success: true, status: q.status };
    }
    async getPublicView(approvalToken) {
        const q = quotationsDb.find(q => q.approval_link === approvalToken);
        if (!q)
            throw new common_1.NotFoundException('Link inválido ou não encontrado');
        if (new Date() > new Date(q.valid_until)) {
            q.status = 'expired';
            throw new common_1.NotFoundException('Este orçamento já expirou');
        }
        return {
            id: q.id,
            number: q.number,
            items: q.items,
            subtotal: q.subtotal,
            discount: q.discount,
            total: q.total,
            valid_until: q.valid_until,
            status: q.status,
            customer_id: q.customer_id
        };
    }
    async approveByCustomer(approvalToken) {
        const q = quotationsDb.find(q => q.approval_link === approvalToken);
        if (!q)
            throw new common_1.NotFoundException('Link inválido');
        if (q.status === 'approved')
            throw new common_1.BadRequestException('Orçamento já aprovado');
        if (new Date() > new Date(q.valid_until) || q.status === 'expired') {
            throw new common_1.BadRequestException('Este orçamento expirou');
        }
        q.status = 'approved';
        this.emitEvent('quotation.approved', new quotation_events_1.QuotationApprovedEvent(q.id, q.tenantId, q.customer_id, q.items, q.total));
        return { success: true, status: q.status, message: 'Orçamento aprovado com sucesso' };
    }
    async markAsExpired() {
        const now = new Date();
        let count = 0;
        quotationsDb.forEach(q => {
            if ((q.status === 'draft' || q.status === 'sent' || q.status === 'viewed') && now > new Date(q.valid_until)) {
                q.status = 'expired';
                count++;
            }
        });
        return { expired_count: count };
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)()
], QuotationsService);
