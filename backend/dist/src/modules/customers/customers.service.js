"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
// In-memory mock replacing DB interaction
let customersDb = [];
let auditLogsDb = [];
let CustomersService = class CustomersService {
    async findAll(tenantId, page = 1, limit = 10, search) {
        let filtered = customersDb.filter(c => c.tenantId === tenantId && c.is_active !== false);
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerSearch) ||
                c.phone.includes(search));
        }
        const total = filtered.length;
        const offset = (page - 1) * limit;
        const data = filtered.slice(offset, offset + limit);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }
    async findById(id, tenantId) {
        const customer = customersDb.find(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
        if (!customer) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return customer;
    }
    async create(tenantId, userId, dto) {
        if (dto.email) {
            const exists = customersDb.find(c => c.email === dto.email && c.tenantId === tenantId);
            if (exists) {
                throw new common_1.ConflictException('E-mail já cadastrado neste tenant');
            }
        }
        const newCustomer = {
            id: Math.random().toString(36).substring(7),
            tenantId,
            ...dto,
            addresses: dto.addresses.map(a => ({ ...a, id: a.id || Math.random().toString(36).substring(7) })),
            total_orders: 0,
            total_spent: 0,
            average_rating: 0,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };
        customersDb.push(newCustomer);
        // Audit log
        auditLogsDb.push({ tenantId, userId, action: 'CREATE_CUSTOMER', entityId: newCustomer.id, createdAt: new Date() });
        return newCustomer;
    }
    async update(id, tenantId, userId, dto) {
        const index = customersDb.findIndex(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
        if (index === -1) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        // Email dupe check
        if (dto.email && dto.email !== customersDb[index].email) {
            const exists = customersDb.find(c => c.email === dto.email && c.tenantId === tenantId);
            if (exists) {
                throw new common_1.ConflictException('E-mail já cadastrado neste tenant');
            }
        }
        const oldValues = { ...customersDb[index] };
        customersDb[index] = {
            ...customersDb[index],
            ...dto,
            updated_at: new Date()
        };
        // Audit log
        auditLogsDb.push({ tenantId, userId, action: 'UPDATE_CUSTOMER', entityId: id, oldValues, newValues: dto, createdAt: new Date() });
        return customersDb[index];
    }
    async delete(id, tenantId, userId) {
        const index = customersDb.findIndex(c => c.id === id && c.tenantId === tenantId && c.is_active !== false);
        if (index === -1) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        customersDb[index].is_active = false;
        customersDb[index].updated_at = new Date();
        // Audit log
        auditLogsDb.push({ tenantId, userId, action: 'DELETE_CUSTOMER', entityId: id, createdAt: new Date() });
        return { success: true };
    }
    async addAddress(customerId, tenantId, address) {
        const customer = await this.findById(customerId, tenantId);
        if (customer.addresses.length >= 5) {
            throw new common_1.ConflictException('Máximo de 5 endereços permitidos');
        }
        const newAddress = { ...address, id: Math.random().toString(36).substring(7) };
        customer.addresses.push(newAddress);
        return newAddress;
    }
    async removeAddress(customerId, addressId, tenantId) {
        const customer = await this.findById(customerId, tenantId);
        customer.addresses = customer.addresses.filter((a) => a.id !== addressId);
        return { success: true };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)()
], CustomersService);
