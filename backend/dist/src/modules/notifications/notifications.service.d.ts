import { NotificationQueue } from './queue/notification.queue';
export declare class NotificationsService {
    private readonly queue;
    private readonly logger;
    constructor(queue: NotificationQueue);
    sendQuotationReminder(quotationId: string, clientPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendServiceOrderConfirmation(serviceOrderId: string, clientPhone: string, technicianPhone: string): Promise<void>;
    sendServiceOrderReminder(serviceOrderId: string, technicianPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendPaymentApproved(paymentId: string, clientPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendAfterSalesFollowUp(afterSalesId: string, clientPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendQuotationCreated(quotationId: string, clientPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendQuotationSent(quotationId: string, clientEmail: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendServiceOrderStarted(serviceOrderId: string, clientPhone: string): Promise<{
        success: boolean;
        jobId?: string;
        duplicate?: boolean;
    }>;
    sendServiceOrderCompleted(serviceOrderId: string, clientEmail: string, clientPhone: string): Promise<void>;
}
