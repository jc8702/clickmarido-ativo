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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadopagoProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let MercadopagoProvider = class MercadopagoProvider {
    secretKey = process.env.MP_WEBHOOK_SECRET || 'test_secret_123';
    async createPreference(amount, description, customerId, serviceOrderId) {
        // Simulando chamada REST ao MercadoPago
        return {
            preference_id: `pref_${Math.random().toString(36).substring(7)}`,
            init_point: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_mock_${serviceOrderId}`,
            qr_code: `00020101021126580014br.gov.bcb.pix0136mock-mercadopago-${serviceOrderId}`
        };
    }
    async getPayment(paymentId) {
        // Simulando consulta REST de status
        return {
            id: paymentId,
            status: 'approved',
            status_detail: 'accredited',
            amount_received: 500
        };
    }
    async refund(paymentId, amount) {
        // Simulando chamada de estorno
        return {
            id: paymentId,
            status: 'refunded',
            amount_refunded: amount
        };
    }
    validateWebhookSignature(xSignature, xRequestId, dataId) {
        if (!xSignature || !xRequestId || !dataId)
            return false;
        try {
            // Formato do x-signature do MP: ts=12345,v1=hash_aqui
            const parts = xSignature.split(',');
            let ts = '';
            let hash = '';
            for (const part of parts) {
                const [key, value] = part.split('=');
                if (key === 'ts')
                    ts = value;
                if (key === 'v1')
                    hash = value;
            }
            if (!ts || !hash)
                return false;
            // MP concatena "id,ts"
            const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
            const computedHash = crypto
                .createHmac('sha256', this.secretKey)
                .update(manifest)
                .digest('hex');
            // Aqui usamos um mock bypass se o hash for exato "mock_valid_signature" para testes E2E
            if (xSignature === 'mock_valid_signature')
                return true;
            return computedHash === hash;
        }
        catch (err) {
            return false;
        }
    }
};
exports.MercadopagoProvider = MercadopagoProvider;
exports.MercadopagoProvider = MercadopagoProvider = __decorate([
    (0, common_1.Injectable)()
], MercadopagoProvider);
