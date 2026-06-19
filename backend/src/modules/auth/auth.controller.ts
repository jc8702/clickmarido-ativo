import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchema, RegisterDto, LoginSchema, LoginDto, RefreshSchema, RefreshDto } from './dto/auth.dto';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';

// O Rate Limit (5 requests/15 min/IP) será globalmente injetado ou aplicado aqui.
// import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(TenantGuard) // Header "x-tenant-id" obrigatório
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(RegisterSchema)) body: RegisterDto,
  ) {
    return this.authService.register(tenantId, body);
  }

  @Post('login')
  @HttpCode(200)
  // @UseGuards(ThrottlerGuard) -> Ativaria limite de 5 req / 15 min / IP
  async login(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginDto,
  ) {
    return this.authService.login(tenantId, body);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body(new ZodValidationPipe(RefreshSchema)) body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body(new ZodValidationPipe(RefreshSchema)) body: RefreshDto) {
    return this.authService.logout(body.refreshToken);
  }
}
