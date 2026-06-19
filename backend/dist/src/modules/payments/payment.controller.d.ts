import { PaymentService } from './payment.service';
import { PaymentWebhookProcessor } from './queue/payment-webhook.processor';
import { MercadopagoProvider } from './providers/mercadopago.provider';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    private readonly webhookProcessor;
    private readonly mpProvider;
    constructor(paymentService: PaymentService, webhookProcessor: PaymentWebhookProcessor, mpProvider: MercadopagoProvider);
    create(tenantId: string, body: CreatePaymentDto): Promise<{
        id: string;
        qr_code: string;
        init_point: string;
        status: string;
    }>;
    getStatus(id: string, tenantId: string): Promise<any>;
    refund(id: string, tenantId: string, body: RefundPaymentDto): Promise<any>;
    handleWebhook(xSignature: string, xRequestId: string, body: any): Promise<{
        received: boolean;
    }>;
}
