"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const after_sales_service_1 = require("../after-sales/after-sales.service");
const payment_service_1 = require("../payments/payment.service");
// Mock de cache Redis em memória
const cacheDb = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos em milissegundos
let DashboardService = DashboardService_1 = class DashboardService {
    logger = new common_1.Logger(DashboardService_1.name);
    queryCount = 0; // Para testar se o cache foi atingido nos testes
    async getOverview(tenantId) {
        const cacheKey = `dashboard:${tenantId}:overview`;
        const cached = this.getCache(cacheKey);
        if (cached) {
            this.logger.log(`[Redis Cache hit] Retornando overview do cache para tenant ${tenantId}`);
            return cached;
        }
        this.logger.log(`[DB Query] Computando overview para tenant ${tenantId}`);
        this.queryCount++;
        // Agregações em memória (equivalentes aos SELECTs do Postgres com índices)
        const paidPayments = payment_service_1.paymentsDb.filter(p => p.status === 'aprovado' && p.tenantId === tenantId);
        const totalRevenue = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const pendingPayments = payment_service_1.paymentsDb.filter(p => p.status === 'pending' && p.tenantId === tenantId);
        const totalPending = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const npsRecords = after_sales_service_1.afterSalesDb.filter(as => as.nps_score !== undefined && as.tenantId === tenantId);
        const npsSum = npsRecords.reduce((acc, curr) => acc + (curr.nps_score || 0), 0);
        const avgNps = npsRecords.length > 0 ? parseFloat((npsSum / npsRecords.length).toFixed(1)) : 10.0;
        const data = {
            kpis: {
                receivedThisMonth: totalRevenue,
                pendingRevenue: totalPending,
                totalOrdersThisMonth: paidPayments.length + pendingPayments.length,
                completionRate: paidPayments.length > 0 ? Math.round((paidPayments.length / (paidPayments.length + pendingPayments.length)) * 100) : 100,
                averageNps: avgNps,
            },
            lastUpdated: new Date(),
        };
        this.setCache(cacheKey, data);
        return data;
    }
    async getRevenueTrend(tenantId, months = 12) {
        // Retorna histórico simulado de faturamento mensal
        return [
            { month: 'Jul/25', faturamento: 12000 },
            { month: 'Ago/25', faturamento: 15000 },
            { month: 'Set/25', faturamento: 14200 },
            { month: 'Out/25', faturamento: 18900 },
            { month: 'Nov/25', faturamento: 22000 },
            { month: 'Dez/25', faturamento: 31000 },
            { month: 'Jan/26', faturamento: 25000 },
            { month: 'Fev/26', faturamento: 27500 },
            { month: 'Mar/26', faturamento: 29000 },
            { month: 'Abr/26', faturamento: 35000 },
            { month: 'Mai/26', faturamento: 38000 },
            { month: 'Jun/26', faturamento: 42000 }
        ].slice(-months);
    }
    async getPaymentMethods(tenantId) {
        return [
            { name: 'PIX', value: 65 },
            { name: 'Cartão de Crédito', value: 25 },
            { name: 'Boleto', value: 10 }
        ];
    }
    async getTopServices(tenantId, limit = 5) {
        return [
            { name: 'Marido de Aluguel', quantidade: 145 },
            { name: 'Eletricista', quantidade: 98 },
            { name: 'Encanador', quantidade: 86 },
            { name: 'Instalação de AC', quantidade: 54 },
            { name: 'Pintor Residencial', quantidade: 32 }
        ].slice(0, limit);
    }
    invalidateCache(tenantId) {
        const cacheKey = `dashboard:${tenantId}:overview`;
        cacheDb.delete(cacheKey);
        this.logger.log(`[Redis Cache invalidate] Cache removido para chave: ${cacheKey}`);
    }
    getQueryCount() {
        return this.queryCount;
    }
    // Helpers do cache
    getCache(key) {
        const cached = cacheDb.get(key);
        if (!cached)
            return null;
        if (Date.now() > cached.expiresAt) {
            cacheDb.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data) {
        cacheDb.set(key, {
            data,
            expiresAt: Date.now() + TTL,
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)()
], DashboardService);
