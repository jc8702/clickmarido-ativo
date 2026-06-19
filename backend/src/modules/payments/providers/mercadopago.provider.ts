import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MercadopagoProvider {
  private readonly secretKey = process.env.MP_WEBHOOK_SECRET || 'test_secret_123';

  async createPreference(amount: number, description: string, customerId: string, serviceOrderId: string) {
    // Simulando chamada REST ao MercadoPago
    return {
      preference_id: `pref_${Math.random().toString(36).substring(7)}`,
      init_point: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref_mock_${serviceOrderId}`,
      qr_code: `00020101021126580014br.gov.bcb.pix0136mock-mercadopago-${serviceOrderId}`
    };
  }

  async getPayment(paymentId: string) {
    // Simulando consulta REST de status
    return {
      id: paymentId,
      status: 'approved',
      status_detail: 'accredited',
      amount_received: 500
    };
  }

  async refund(paymentId: string, amount: number) {
    // Simulando chamada de estorno
    return {
      id: paymentId,
      status: 'refunded',
      amount_refunded: amount
    };
  }

  validateWebhookSignature(xSignature: string, xRequestId: string, dataId: string): boolean {
    if (!xSignature || !xRequestId || !dataId) return false;

    try {
      // Formato do x-signature do MP: ts=12345,v1=hash_aqui
      const parts = xSignature.split(',');
      let ts = '';
      let hash = '';

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') hash = value;
      }

      if (!ts || !hash) return false;

      // MP concatena "id,ts"
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const computedHash = crypto
        .createHmac('sha256', this.secretKey)
        .update(manifest)
        .digest('hex');

      // Aqui usamos um mock bypass se o hash for exato "mock_valid_signature" para testes E2E
      if (xSignature === 'mock_valid_signature') return true;

      return computedHash === hash;
    } catch (err) {
      return false;
    }
  }
}
