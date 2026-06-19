export interface AssignmentStrategy {
    assignNext(tenantId: string): Promise<string>;
}
export declare class RoundRobinTechnicianStrategy implements AssignmentStrategy {
    private readonly getActiveOrders;
    constructor(getActiveOrders: (tenantId: string) => any[]);
    assignNext(tenantId: string): Promise<string>;
}
