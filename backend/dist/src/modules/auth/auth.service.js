"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
// Mock in-memory do BD para o MVP (substituir depois por queries do PG/Drizzle/Prisma)
const usersDb = [];
const refreshTokensDb = new Map(); // token -> userId
let AuthService = class AuthService {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async register(tenantId, dto) {
        // 1. Valida email único por tenant
        const exists = usersDb.find(u => u.email === dto.email && u.tenantId === tenantId);
        if (exists) {
            throw new common_1.ConflictException('E-mail já cadastrado neste tenant');
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
    async login(tenantId, dto) {
        // Validar credenciais
        const user = usersDb.find(u => u.email === dto.email && u.tenantId === tenantId);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        return this.generateTokens(user);
    }
    async refresh(refreshToken) {
        // Valida refreshToken em DB (blacklist/whitelist mapping)
        const userId = refreshTokensDb.get(refreshToken);
        if (!userId) {
            throw new common_1.UnauthorizedException('Refresh token inválido ou expirado');
        }
        const user = usersDb.find(u => u.id === userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        // Gera novo accessToken
        const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        return { accessToken };
    }
    async logout(refreshToken) {
        // Invalida refreshToken (set para null / apaga no db)
        refreshTokensDb.delete(refreshToken);
        return { success: true };
    }
    generateTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
        // Gera accessToken (15 min, HS256)
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        // Gera refreshToken (7 dias, HS256)
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        // Armazenado em DB
        refreshTokensDb.set(refreshToken, user.id);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object])
], AuthService);
