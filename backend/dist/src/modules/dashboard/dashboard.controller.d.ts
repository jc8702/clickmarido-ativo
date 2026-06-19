import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(tenantId: string): Promise<any>;
    getRevenueTrend(tenantId: string, months?: number): Promise<{
        month: string;
        faturamento: number;
    }[]>;
    getPaymentMethods(tenantId: string): Promise<{
        name: string;
        value: number;
    }[]>;
    getTopServices(tenantId: string, limit?: number): Promise<{
        name: string;
        quantidade: number;
    }[]>;
}
