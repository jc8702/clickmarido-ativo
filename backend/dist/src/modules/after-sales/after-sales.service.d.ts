import { NotificationQueue } from '../notifications/queue/notification.queue';
export interface AfterSales {
    id: string;
    tenantId: string;
    service_order_id: string;
    contact_date: Date;
    satisfaction_rating?: number;
    nps_score?: number;
    feedback_text?: string;
    problem_identified?: boolean;
    action_required?: string;
    token: string;
}
export declare let afterSalesDb: AfterSales[];
export declare class AfterSalesService {
    private readonly notificationQueue;
    constructor(notificationQueue: NotificationQueue);
    schedule(tenantId: string, serviceOrderId: string): Promise<AfterSales>;
    sendFollowUp(afterSalesId: string): Promise<{
        success: boolean;
    }>;
    submitFeedback(token: string, rating: number, nps: number, feedback: string): Promise<AfterSales>;
    clear(): Promise<void>;
}
