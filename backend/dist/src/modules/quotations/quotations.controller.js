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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsController = void 0;
const common_1 = require("@nestjs/common");
const quotations_service_1 = require("./quotations.service");
const quotation_dto_1 = require("./dto/quotation.dto");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const jwt_guard_1 = require("../../shared/guards/jwt.guard");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../../shared/pipes/zod-validation.pipe");
const PartialQuotationSchema = quotation_dto_1.QuotationSchema.partial();
let QuotationsController = class QuotationsController {
    quotationsService;
    constructor(quotationsService) {
        this.quotationsService = quotationsService;
    }
    // PÚBLICO: Não possui Guards
    async getPublicView(token) {
        return this.quotationsService.getPublicView(token);
    }
    // PÚBLICO: Não possui Guards
    async approveByCustomer(token) {
        return this.quotationsService.approveByCustomer(token);
    }
    // PROTEGIDAS
    async findAll(tenantId, status) {
        return this.quotationsService.findAll(tenantId, status);
    }
    async findById(id, tenantId) {
        return this.quotationsService.findById(id, tenantId);
    }
    async create(tenantId, user, body) {
        return this.quotationsService.create(tenantId, user?.userId || 'system', body);
    }
    async update(id, tenantId, body) {
        return this.quotationsService.update(id, tenantId, body);
    }
    async send(id, tenantId, method) {
        return this.quotationsService.send(id, tenantId, method || 'whatsapp');
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Get)('public/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "getPublicView", null);
__decorate([
    (0, common_1.Post)('public/:token/approve'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "approveByCustomer", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findById", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(quotation_dto_1.QuotationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_a = typeof quotation_dto_1.QuotationDto !== "undefined" && quotation_dto_1.QuotationDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(PartialQuotationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "send", null);
exports.QuotationsController = QuotationsController = __decorate([
    (0, common_1.Controller)('quotations'),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService])
], QuotationsController);
