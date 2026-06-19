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
exports.ServiceOrdersService = void 0;
const common_1 = require("@nestjs/common");
const technician_assignment_strategy_1 = require("./strategies/technician-assignment.strategy");
let serviceOrdersDb = [];
let seqGlobal = 1000;
let ServiceOrdersService = class ServiceOrdersService {
    assignmentStrategy;
    constructor() {
        this.assignmentStrategy = new technician_assignment_strategy_1.RoundRobinTechnicianStrategy((tenantId) => serviceOrdersDb.filter(o => o.tenantId === tenantId));
    }
    async findAll(tenantId, status) {
        let filtered = serviceOrdersDb.filter(o => o.tenantId === tenantId);
        if (status) {
            filtered = filtered.filter(o => o.status === status);
        }
        return filtered;
    }
    async findById(id, tenantId) {
        const os = serviceOrdersDb.find(o => o.id === id && o.tenantId === tenantId);
        if (!os)
            throw new common_1.NotFoundException('Ordem de Serviço não encontrada');
        return os;
    }
    async create(tenantId, dto) {
        // 1. Busca o técnico menos ocupado
        const technicianId = await this.assignmentStrategy.assignNext(tenantId);
        seqGlobal++;
        const newOs = {
            id: Math.random().toString(36).substring(7),
            number: `OS-${seqGlobal}`,
            tenantId,
            quotation_id: dto.quotation_id,
            customer_id: 'cust-mock-123', // Em um cenário real, viria do quotation
            technician_id: technicianId,
            address_id: 'addr-mock-123', // Em um cenário real, viria do customer default address
            scheduled_date: new Date(dto.scheduled_date),
            scheduled_time: dto.scheduled_time,
            status: 'agendada',
            arrival_time: null,
            completion_time: null,
            before_photos: [],
            after_photos: [],
            final_total: null,
            created_at: new Date()
        };
        serviceOrdersDb.push(newOs);
        // Envio de notificações simulado
        console.log(`[MOCK NOTIFICAÇÃO] SMS Técnico ${technicianId}: Nova OS Agendada ${newOs.number}`);
        console.log(`[MOCK NOTIFICAÇÃO] E-mail Cliente: Serviço ${newOs.number} agendado para ${dto.scheduled_date} às ${dto.scheduled_time}`);
        return newOs;
    }
    async start(id, tenantId, userId) {
        const os = await this.findById(id, tenantId);
        if (os.status !== 'agendada') {
            throw new common_1.BadRequestException('Apenas ordens agendadas podem ser iniciadas');
        }
        os.status = 'em_progresso';
        os.arrival_time = new Date();
        console.log(`[MOCK NOTIFICAÇÃO] WhatsApp Cliente: O técnico acaba de chegar e iniciar a OS ${os.number}.`);
        return os;
    }
    async uploadPhotos(id, tenantId, dto) {
        const os = await this.findById(id, tenantId);
        // Simula validação de que só faz upload se não estiver concluída/cancelada
        if (os.status === 'concluida' || os.status === 'cancelada') {
            throw new common_1.BadRequestException('Impossível alterar fotos de uma OS finalizada');
        }
        if (dto.before_photos)
            os.before_photos = [...os.before_photos, ...dto.before_photos];
        if (dto.after_photos)
            os.after_photos = [...os.after_photos, ...dto.after_photos];
        console.log(`[MOCK CLOUDINARY] Upload de fotos realizado com sucesso para OS ${os.number}`);
        return os;
    }
    async complete(id, tenantId, dto) {
        const os = await this.findById(id, tenantId);
        if (os.status !== 'em_progresso') {
            throw new common_1.BadRequestException('Apenas ordens em progresso podem ser concluídas');
        }
        os.status = 'concluida';
        os.completion_time = new Date();
        os.final_total = dto.finalTotal || null;
        os.notes = dto.notes || '';
        return os;
    }
    async cancel(id, tenantId, dto) {
        const os = await this.findById(id, tenantId);
        if (os.status === 'concluida') {
            throw new common_1.BadRequestException('Impossível cancelar uma OS já concluída');
        }
        os.status = 'cancelada';
        os.cancel_reason = dto.reason;
        os.canceled_at = new Date();
        return os;
    }
};
exports.ServiceOrdersService = ServiceOrdersService;
exports.ServiceOrdersService = ServiceOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ServiceOrdersService);
