import { DashboardService } from './dashboard.service';
export declare class DashboardListener {
    private readonly dashboardService;
    private readonly logger;
    constructor(dashboardService: DashboardService);
    handleServiceOrderCompleted(event: {
        tenantId: string;
    }): void;
    handleServiceOrderScheduled(event: {
        tenantId: string;
    }): void;
    handlePaymentApproved(event: {
        tenantId: string;
    }): void;
}
