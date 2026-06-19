import { Injectable, NotFoundException } from '@nestjs/common';
import { MercadopagoProvider } from './providers/mercadopago.provider';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';

// DB Mock
export let paymentsDb: any[] = [];

@Injectable()
export class PaymentService {
  constructor(private readonly mpProvider: MercadopagoProvider) {}

  async create(tenantId: string, dto: CreatePaymentDto) {
    // Chamaria o MP Provider
    const { preference_id, init_point, qr_code } = await this.mpProvider.createPreference(
      dto.amount,
      `Serviço OS: ${dto.serviceOrderId}`,
      'customer-mock-id',
      dto.serviceOrderId
    );

    const payment = {
      id: Math.random().toString(36).substring(7),
      tenantId,
      service_order_id: dto.serviceOrderId,
      amount: dto.amount,
      payment_method: dto.method,
      status: 'pending',
      mercadopago_payment_id: preference_id,
      mercadopago_qr_code: qr_code,
      init_point,
      paid_at: null,
      created_at: new Date()
    };

    paymentsDb.push(payment);

    console.log(`[NOTIFICAÇÃO MOCK] E-mail enviado com QR Code PIX para a OS ${dto.serviceOrderId}`);

    return {
      id: payment.id,
      qr_code,
      init_point,
      status: payment.status
    };
  }

  async getPaymentStatus(id: string, tenantId: string) {
    const payment = paymentsDb.find(p => p.id === id && p.tenantId === tenantId);
    if (!payment) throw new NotFoundException('Pagamento não localizado');
    return payment;
  }

  // O handler que é executado na Fila
  async handleWebhookAction(mercadopagoPaymentId: string, status: string, tenantId: string) {
    const payment = paymentsDb.find(p => p.mercadopago_payment_id === mercadopagoPaymentId);
    if (!payment) {
      throw new Error(`Payment com preference ${mercadopagoPaymentId} não encontrado no banco`);
    }

    if (status === 'approved') {
      payment.status = 'aprovado';
      payment.paid_at = new Date();
      console.log(`[NOTIFICAÇÃO MOCK] WhatsApp Cliente: Pagamento Aprovado! OS: ${payment.service_order_id}`);
      // Lógica de after sales agendamento poderia ser disparada aqui
      console.log(`[EVENTO MOCK] After-sales scheduled para +7 dias.`);
    } else if (status === 'rejected') {
      payment.status = 'rejeitado';
      console.log(`[NOTIFICAÇÃO MOCK] SMS Cliente: Pagamento recusado para OS: ${payment.service_order_id}`);
    }
  }

  async refund(id: string, tenantId: string, dto: RefundPaymentDto) {
    const payment = await this.getPaymentStatus(id, tenantId);
    if (payment.status !== 'aprovado') {
      throw new Error('Apenas pagamentos aprovados podem ser estornados');
    }

    const refundRes = await this.mpProvider.refund(payment.mercadopago_payment_id, dto.amount);
    
    payment.status = 'reembolsado';
    payment.refund_amount = refundRes.amount_refunded;

    return payment;
  }
}
