import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// Mock in-memory do BD para o MVP (substituir depois por queries do PG/Drizzle/Prisma)
const usersDb: any[] = [];
const refreshTokensDb = new Map<string, string>(); // token -> userId

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(tenantId: string, dto: RegisterDto) {
    // 1. Valida email único por tenant
    const exists = usersDb.find(u => u.email === dto.email && u.tenantId === tenantId);
    if (exists) {
      throw new ConflictException('E-mail já cadastrado neste tenant');
    }

    // 2. Hash senha bcrypt (rounds: 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Cria user em DB
    const newUser = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
      role: 'cliente' // Role default (pode ser admin via seed)
    };
    usersDb.push(newUser);

    // 4. Retorna os tokens
    return this.generateTokens(newUser);
  }

  async login(tenantId: string, dto: LoginDto) {
    // Validar credenciais
    const user = usersDb.find(u => u.email === dto.email && u.tenantId === tenantId);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    // Valida refreshToken em DB (blacklist/whitelist mapping)
    const userId = refreshTokensDb.get(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = usersDb.find(u => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Gera novo accessToken
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    // Invalida refreshToken (set para null / apaga no db)
    refreshTokensDb.delete(refreshToken);
    return { success: true };
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    
    // Gera accessToken (15 min, HS256)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    // Gera refreshToken (7 dias, HS256)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Armazenado em DB
    refreshTokensDb.set(refreshToken, user.id);

    return { accessToken, refreshToken };
  }
}
