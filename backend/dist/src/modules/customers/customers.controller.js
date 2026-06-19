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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const customer_dto_1 = require("./dto/customer.dto");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const jwt_guard_1 = require("../../shared/guards/jwt.guard");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../../shared/pipes/zod-validation.pipe");
const PartialCustomerSchema = customer_dto_1.CustomerSchema.partial();
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    async findAll(tenantId, page, limit, search) {
        return this.customersService.findAll(tenantId, Number(page) || 1, Number(limit) || 10, search);
    }
    async findById(id, tenantId) {
        return this.customersService.findById(id, tenantId);
    }
    async create(tenantId, user, body) {
        return this.customersService.create(tenantId, user?.userId || 'system', body);
    }
    async update(id, tenantId, user, body) {
        return this.customersService.update(id, tenantId, user?.userId || 'system', body);
    }
    async delete(id, tenantId, user) {
        return this.customersService.delete(id, tenantId, user?.userId || 'system');
    }
    async addAddress(id, tenantId, body) {
        return this.customersService.addAddress(id, tenantId, body);
    }
    async removeAddress(id, addressId, tenantId) {
        return this.customersService.removeAddress(id, addressId, tenantId);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(customer_dto_1.CustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_a = typeof customer_dto_1.CustomerDto !== "undefined" && customer_dto_1.CustomerDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(PartialCustomerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/addresses'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(customer_dto_1.AddressSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_b = typeof customer_dto_1.AddressDto !== "undefined" && customer_dto_1.AddressDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "addAddress", null);
__decorate([
    (0, common_1.Delete)(':id/addresses/:addressId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('addressId')),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "removeAddress", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard) // Protegido pelo RLS nativo do framework/BD simulado
    ,
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
