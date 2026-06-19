import { Injectable } from '@nestjs/common';
import { PaymentService } from '../payment.service';

/**
 * Mock para a Fila do BullMQ 
 * Em produção teríamos algo como:
 * @Processor('webhook-queue')
 * export class WebhookProcessor extends WorkerHost
 */
@Injectable()
export class PaymentWebhookProcessor {
  constructor(private readonly paymentService: PaymentService) {}

  // Simula a injeção assíncrona na fila com retries (1s, 5s, 30s)
  async enqueueWebhookPayload(paymentId: string, status: string, tenantId: string) {
    const retries = [1000, 5000, 30000];
    let attempt = 0;

    const process = async () => {
      try {
        await this.paymentService.handleWebhookAction(paymentId, status, tenantId);
        console.log(`[BULL-MOCK] Job de webhook executado com sucesso para payment ${paymentId}`);
      } catch (error) {
        if (attempt < retries.length) {
          console.log(`[BULL-MOCK] Falha ao processar webhook. Tentando novamente em ${retries[attempt]}ms (tentativa ${attempt + 1})`);
          setTimeout(process, retries[attempt]);
          attempt++;
        } else {
          console.error(`[BULL-MOCK] Job falhou definitivamente após ${retries.length} tentativas para payment ${paymentId}`);
        }
      }
    };

    // Joga pra callstack paralela
    setTimeout(process, 100);
  }
}
