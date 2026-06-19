import { PaymentService } from '../payment.service';
/**
 * Mock para a Fila do BullMQ
 * Em produção teríamos algo como:
 * @Processor('webhook-queue')
 * export class WebhookProcessor extends WorkerHost
 */
export declare class PaymentWebhookProcessor {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    enqueueWebhookPayload(paymentId: string, status: string, tenantId: string): Promise<void>;
}
