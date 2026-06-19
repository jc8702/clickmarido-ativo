"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendEmailProvider = void 0;
const common_1 = require("@nestjs/common");
let ResendEmailProvider = class ResendEmailProvider {
    async sendEmail(to, subject, body) {
        console.log(`[ResendEmailProvider] Enviando E-mail para ${to} | Assunto: ${subject}`);
        if (to && to.includes('fail-email')) {
            return { success: false, messageId: '', error: 'Resend API Limit Exceeded' };
        }
        return {
            success: true,
            messageId: `email_${Math.random().toString(36).substring(7)}`,
        };
    }
};
exports.ResendEmailProvider = ResendEmailProvider;
exports.ResendEmailProvider = ResendEmailProvider = __decorate([
    (0, common_1.Injectable)()
], ResendEmailProvider);
