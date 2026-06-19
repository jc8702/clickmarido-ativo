import { NotificationsService } from './notifications.service';
export declare class NotificationsListener {
    private readonly notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    handleQuotationCreated(event: {
        id: string;
        clientPhone: string;
    }): Promise<void>;
    handleQuotationSent(event: {
        id: string;
        clientEmail: string;
    }): Promise<void>;
    handleServiceOrderScheduled(event: {
        id: string;
        clientPhone: string;
        technicianPhone: string;
    }): Promise<void>;
    handleServiceOrderStarted(event: {
        id: string;
        clientPhone: string;
    }): Promise<void>;
    handleServiceOrderCompleted(event: {
        id: string;
        clientEmail: string;
        clientPhone: string;
    }): Promise<void>;
    handlePaymentApproved(event: {
        id: string;
        clientPhone: string;
    }): Promise<void>;
}
