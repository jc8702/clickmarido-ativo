import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(tenantId: string, body: RegisterDto): Promise<{
        accessToken: any;
        refreshToken: any;
    }>;
    login(tenantId: string, body: LoginDto): Promise<{
        accessToken: any;
        refreshToken: any;
    }>;
    refresh(body: RefreshDto): Promise<{
        accessToken: any;
    }>;
    logout(body: RefreshDto): Promise<{
        success: boolean;
    }>;
}
