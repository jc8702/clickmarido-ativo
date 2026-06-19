export interface Warranty {
    id: string;
    tenantId: string;
    service_order_id: string;
    type: string;
    start_date: Date;
    end_date: Date;
    status: 'ativa' | 'expirada' | 'usada';
    claim_reason?: string;
    claimed_at?: Date;
}
export declare let warrantiesDb: Warranty[];
export declare class WarrantiesService {
    createFromServiceOrder(tenantId: string, serviceOrderId: string, durationMonths?: number): Promise<Warranty>;
    findActive(tenantId: string, customerId?: string): Promise<Warranty[]>;
    findExpiringSoon(tenantId: string): Promise<Warranty[]>;
    claimWarranty(id: string, tenantId: string, description: string): Promise<Warranty>;
    clear(): Promise<void>;
}
