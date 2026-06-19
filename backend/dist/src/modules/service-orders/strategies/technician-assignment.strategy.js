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
exports.RoundRobinTechnicianStrategy = void 0;
const common_1 = require("@nestjs/common");
// Mock DB de técnicos
const techniciansDb = [
    { id: 'tech-1', name: 'Técnico Alpha', tenantId: 'tenant-a-123' },
    { id: 'tech-2', name: 'Técnico Beta', tenantId: 'tenant-a-123' },
];
let RoundRobinTechnicianStrategy = class RoundRobinTechnicianStrategy {
    getActiveOrders;
    // Injecting the service-orders DB reference loosely for the MVP mock
    constructor(getActiveOrders) {
        this.getActiveOrders = getActiveOrders;
    }
    async assignNext(tenantId) {
        const availableTechs = techniciansDb.filter(t => t.tenantId === tenantId);
        if (availableTechs.length === 0) {
            throw new Error('Nenhum técnico disponível neste tenant');
        }
        const activeOrders = this.getActiveOrders(tenantId);
        // Calcula a carga de cada técnico
        const loads = availableTechs.map(tech => {
            const activeCount = activeOrders.filter(o => o.technician_id === tech.id &&
                (o.status === 'agendada' || o.status === 'em_progresso')).length;
            return { techId: tech.id, count: activeCount };
        });
        // Ordena do menor pro maior e pega o primeiro (round-robin / balanceamento por carga)
        loads.sort((a, b) => a.count - b.count);
        return loads[0].techId;
    }
};
exports.RoundRobinTechnicianStrategy = RoundRobinTechnicianStrategy;
exports.RoundRobinTechnicianStrategy = RoundRobinTechnicianStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], RoundRobinTechnicianStrategy);
