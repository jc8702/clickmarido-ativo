"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioSmsProvider = void 0;
const common_1 = require("@nestjs/common");
let TwilioSmsProvider = class TwilioSmsProvider {
    async sendSms(to, message) {
        console.log(`[TwilioSmsProvider] Enviando SMS para ${to}: "${message}"`);
        // Simula uma pequena taxa de erro intermitente para os testes de retry se necessário,
        // ou apenas sucesso por padrão. Podemos customizar nos testes E2E injetando mock.
        if (to && to.includes('fail-sms')) {
            return { success: false, messageId: '', error: 'Twilio SMS Gateway Timeout' };
        }
        return {
            success: true,
            messageId: `sms_${Math.random().toString(36).substring(7)}`,
        };
    }
};
exports.TwilioSmsProvider = TwilioSmsProvider;
exports.TwilioSmsProvider = TwilioSmsProvider = __decorate([
    (0, common_1.Injectable)()
], TwilioSmsProvider);
