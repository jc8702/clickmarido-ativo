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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceOrdersController = void 0;
const common_1 = require("@nestjs/common");
const service_orders_service_1 = require("./service-orders.service");
const service_order_dto_1 = require("./dto/service-order.dto");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const jwt_guard_1 = require("../../shared/guards/jwt.guard");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../../shared/pipes/zod-validation.pipe");
let ServiceOrdersController = class ServiceOrdersController {
    osService;
    constructor(osService) {
        this.osService = osService;
    }
    async findAll(tenantId, status) {
        return this.osService.findAll(tenantId, status);
    }
    async findById(id, tenantId) {
        return this.osService.findById(id, tenantId);
    }
    async create(tenantId, body) {
        return this.osService.create(tenantId, body);
    }
    async start(id, tenantId, user) {
        return this.osService.start(id, tenantId, user?.userId || 'system');
    }
    async uploadPhotos(id, tenantId, body) {
        return this.osService.uploadPhotos(id, tenantId, body);
    }
    async complete(id, tenantId, body) {
        return this.osService.complete(id, tenantId, body);
    }
    async cancel(id, tenantId, body) {
        return this.osService.cancel(id, tenantId, body);
    }
};
exports.ServiceOrdersController = ServiceOrdersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(service_order_dto_1.CreateServiceOrderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof service_order_dto_1.CreateServiceOrderDto !== "undefined" && service_order_dto_1.CreateServiceOrderDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(service_order_dto_1.UploadPhotosSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_b = typeof service_order_dto_1.UploadPhotosDto !== "undefined" && service_order_dto_1.UploadPhotosDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "uploadPhotos", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(service_order_dto_1.CompleteServiceOrderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_c = typeof service_order_dto_1.CompleteServiceOrderDto !== "undefined" && service_order_dto_1.CompleteServiceOrderDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(service_order_dto_1.CancelServiceOrderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_d = typeof service_order_dto_1.CancelServiceOrderDto !== "undefined" && service_order_dto_1.CancelServiceOrderDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ServiceOrdersController.prototype, "cancel", null);
exports.ServiceOrdersController = ServiceOrdersController = __decorate([
    (0, common_1.Controller)('service-orders'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [service_orders_service_1.ServiceOrdersService])
], ServiceOrdersController);
