import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Em teoria o TenantGuard já validou ou o JwtStrategy extraiu.
    // Aqui garantimos fácil acesso ao tenantId injetado.
    return request.tenantId || request.headers['x-tenant-id'];
  },
);
