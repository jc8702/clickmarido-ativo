import { WarrantiesService } from '../warranties/warranties.service';
import { AfterSalesService } from './after-sales.service';
export declare class AfterSalesListener {
    private readonly warrantiesService;
    private readonly afterSalesService;
    private readonly logger;
    constructor(warrantiesService: WarrantiesService, afterSalesService: AfterSalesService);
    handlePaymentApproved(event: {
        id: string;
        serviceOrderId: string;
        tenantId: string;
    }): Promise<void>;
}
