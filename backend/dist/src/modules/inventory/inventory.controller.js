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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const jwt_guard_1 = require("../../shared/guards/jwt.guard");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const zod_validation_pipe_1 = require("../../shared/pipes/zod-validation.pipe");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async findAll(tenantId) {
        return inventory_service_1.inventoryDb.filter(i => i.tenantId === tenantId);
    }
    async getLowStockItems(tenantId) {
        return this.inventoryService.getLowStockItems(tenantId);
    }
    async createItem(tenantId, body) {
        return this.inventoryService.createItem(tenantId, body);
    }
    async reserve(tenantId, body) {
        return this.inventoryService.reserveForServiceOrder(tenantId, body);
    }
    async release(tenantId, body) {
        return this.inventoryService.releaseReservation(tenantId, body.serviceOrderId);
    }
    async consume(tenantId, body) {
        return this.inventoryService.consumeForServiceOrder(tenantId, body.serviceOrderId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(inventory_dto_1.CreateInventoryItemSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof inventory_dto_1.CreateInventoryItemDto !== "undefined" && inventory_dto_1.CreateInventoryItemDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createItem", null);
__decorate([
    (0, common_1.Post)('reserve'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(inventory_dto_1.ReserveInventorySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof inventory_dto_1.ReserveInventoryDto !== "undefined" && inventory_dto_1.ReserveInventoryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "reserve", null);
__decorate([
    (0, common_1.Post)('release'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(inventory_dto_1.ConsumeInventorySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof inventory_dto_1.ConsumeInventoryDto !== "undefined" && inventory_dto_1.ConsumeInventoryDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "release", null);
__decorate([
    (0, common_1.Post)('consume'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(inventory_dto_1.ConsumeInventorySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof inventory_dto_1.ConsumeInventoryDto !== "undefined" && inventory_dto_1.ConsumeInventoryDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "consume", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
