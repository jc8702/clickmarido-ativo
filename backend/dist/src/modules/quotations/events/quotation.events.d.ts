export declare class QuotationCreatedEvent {
    readonly quotationId: string;
    readonly tenantId: string;
    readonly customerId: string;
    readonly total: number;
    constructor(quotationId: string, tenantId: string, customerId: string, total: number);
}
export declare class QuotationApprovedEvent {
    readonly quotationId: string;
    readonly tenantId: string;
    readonly customerId: string;
    readonly items: any[];
    readonly total: number;
    constructor(quotationId: string, tenantId: string, customerId: string, items: any[], total: number);
}
