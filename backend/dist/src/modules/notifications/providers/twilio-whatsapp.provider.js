"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWhatsAppProvider = void 0;
const common_1 = require("@nestjs/common");
let TwilioWhatsAppProvider = class TwilioWhatsAppProvider {
    async sendWhatsApp(to, message) {
        console.log(`[TwilioWhatsAppProvider] Enviando WhatsApp para ${to}: "${message}"`);
        if (to && to.includes('fail-wa')) {
            return { success: false, messageId: '', error: 'Twilio WhatsApp Gateway Error' };
        }
        return {
            success: true,
            messageId: `wa_${Math.random().toString(36).substring(7)}`,
        };
    }
};
exports.TwilioWhatsAppProvider = TwilioWhatsAppProvider;
exports.TwilioWhatsAppProvider = TwilioWhatsAppProvider = __decorate([
    (0, common_1.Injectable)()
], TwilioWhatsAppProvider);
