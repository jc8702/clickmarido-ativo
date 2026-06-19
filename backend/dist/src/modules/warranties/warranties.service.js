"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantiesService = exports.warrantiesDb = void 0;
const common_1 = require("@nestjs/common");
exports.warrantiesDb = [];
let WarrantiesService = class WarrantiesService {
    async createFromServiceOrder(tenantId, serviceOrderId, durationMonths = 12) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);
        const newWarranty = {
            id: `warr_${Math.random().toString(36).substring(7)}`,
            tenantId,
            service_order_id: serviceOrderId,
            type: `${durationMonths} Meses de Cobertura`,
            start_date: startDate,
            end_date: endDate,
            status: 'ativa',
        };
        exports.warrantiesDb.push(newWarranty);
        return newWarranty;
    }
    async findActive(tenantId, customerId) {
        // Para simplificar a simulação de RLS / Tenant
        return exports.warrantiesDb.filter(w => w.tenantId === tenantId && w.status === 'ativa');
    }
    async findExpiringSoon(tenantId) {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return exports.warrantiesDb.filter(w => w.tenantId === tenantId &&
            w.status === 'ativa' &&
            w.end_date > now &&
            w.end_date <= thirtyDaysFromNow);
    }
    async claimWarranty(id, tenantId, description) {
        const warranty = exports.warrantiesDb.find(w => w.id === id && w.tenantId === tenantId);
        if (!warranty)
            throw new common_1.NotFoundException('Garantia não encontrada');
        warranty.status = 'usada';
        warranty.claim_reason = description;
        warranty.claimed_at = new Date();
        console.log(`[WARRANTY CLAIMED] Garantia ${warranty.id} acionada. Descrição: "${description}"`);
        return warranty;
    }
    async clear() {
        exports.warrantiesDb = [];
    }
};
exports.WarrantiesService = WarrantiesService;
exports.WarrantiesService = WarrantiesService = __decorate([
    (0, common_1.Injectable)()
], WarrantiesService);
