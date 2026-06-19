import { MercadopagoProvider } from './providers/mercadopago.provider';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
export declare let paymentsDb: any[];
export declare class PaymentService {
    private readonly mpProvider;
    constructor(mpProvider: MercadopagoProvider);
    create(tenantId: string, dto: CreatePaymentDto): Promise<{
        id: string;
        qr_code: string;
        init_point: string;
        status: string;
    }>;
    getPaymentStatus(id: string, tenantId: string): Promise<any>;
    handleWebhookAction(mercadopagoPaymentId: string, status: string, tenantId: string): Promise<void>;
    refund(id: string, tenantId: string, dto: RefundPaymentDto): Promise<any>;
}
