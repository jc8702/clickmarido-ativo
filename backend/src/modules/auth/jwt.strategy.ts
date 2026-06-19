import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura',
    });
  }

  async validate(payload: any) {
    // payload contém os dados que injetamos no token (sub, email, role, tenantId)
    if (!payload) {
      throw new UnauthorizedException('Payload do JWT não encontrado');
    }
    
    // Anexa as info extraídas no request.user automaticamente via guard
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      tenantId: payload.tenantId 
    };
  }
}
