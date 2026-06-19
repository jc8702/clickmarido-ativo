import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    register(tenantId: string, dto: RegisterDto): Promise<{
        accessToken: any;
        refreshToken: any;
    }>;
    login(tenantId: string, dto: LoginDto): Promise<{
        accessToken: any;
        refreshToken: any;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: any;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
    private generateTokens;
}
