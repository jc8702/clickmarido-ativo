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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantiesModule = exports.WarrantiesController = void 0;
const common_1 = require("@nestjs/common");
const warranties_service_1 = require("./warranties.service");
const after_sales_service_1 = require("../after-sales/after-sales.service");
const after_sales_listener_1 = require("../after-sales/after-sales.listener");
const notifications_module_1 = require("../notifications/notifications.module");
let WarrantiesController = class WarrantiesController {
    warrantiesService;
    afterSalesService;
    constructor(warrantiesService, afterSalesService) {
        this.warrantiesService = warrantiesService;
        this.afterSalesService = afterSalesService;
    }
    async getActiveWarranties(tenantId) {
        return this.warrantiesService.findActive(tenantId || 'tenant-123');
    }
    async claim(id, dto, tenantId) {
        return this.warrantiesService.claimWarranty(id, tenantId || 'tenant-123', dto.description);
    }
    async submitFeedback(token, dto) {
        return this.afterSalesService.submitFeedback(token, dto.rating, dto.nps, dto.feedbackText);
    }
};
exports.WarrantiesController = WarrantiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WarrantiesController.prototype, "getActiveWarranties", null);
__decorate([
    (0, common_1.Post)(':id/claim'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], WarrantiesController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)('feedback'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarrantiesController.prototype, "submitFeedback", null);
exports.WarrantiesController = WarrantiesController = __decorate([
    (0, common_1.Controller)('warranties'),
    __metadata("design:paramtypes", [warranties_service_1.WarrantiesService,
        after_sales_service_1.AfterSalesService])
], WarrantiesController);
let WarrantiesModule = class WarrantiesModule {
};
exports.WarrantiesModule = WarrantiesModule;
exports.WarrantiesModule = WarrantiesModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [WarrantiesController],
        providers: [
            warranties_service_1.WarrantiesService,
            after_sales_service_1.AfterSalesService,
            after_sales_listener_1.AfterSalesListener,
        ],
        exports: [warranties_service_1.WarrantiesService, after_sales_service_1.AfterSalesService],
    })
], WarrantiesModule);
