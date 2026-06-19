export declare class DashboardService {
    private readonly logger;
    private queryCount;
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
    invalidateCache(tenantId: string): void;
    getQueryCount(): number;
    private getCache;
    private setCache;
}
