export declare class MercadopagoProvider {
    private readonly secretKey;
    createPreference(amount: number, description: string, customerId: string, serviceOrderId: string): Promise<{
        preference_id: string;
        init_point: string;
        qr_code: string;
    }>;
    getPayment(paymentId: string): Promise<{
        id: string;
        status: string;
        status_detail: string;
        amount_received: number;
    }>;
    refund(paymentId: string, amount: number): Promise<{
        id: string;
        status: string;
        amount_refunded: number;
    }>;
    validateWebhookSignature(xSignature: string, xRequestId: string, dataId: string): boolean;
}
