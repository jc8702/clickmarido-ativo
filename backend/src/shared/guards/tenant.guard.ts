import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // O header pode ser extraído para identificar o contexto
    const tenantId = request.headers['x-tenant-id'];
    
    if (!tenantId) {
      throw new BadRequestException('O header x-tenant-id é obrigatório para esta rota');
    }
    
    // Salva na request para uso nos controllers/services
    request.tenantId = tenantId;
    return true;
  }
}
