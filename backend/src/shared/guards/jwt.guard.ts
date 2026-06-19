import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Aqui você pode injetar lógica customizada antes da validação do JWT
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Lança erro caso o JWT seja inválido ou o user não exista
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou não fornecido');
    }
    return user;
  }
}
