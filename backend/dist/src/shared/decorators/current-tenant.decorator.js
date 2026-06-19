"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    // Em teoria o TenantGuard já validou ou o JwtStrategy extraiu.
    // Aqui garantimos fácil acesso ao tenantId injetado.
    return request.tenantId || request.headers['x-tenant-id'];
});
