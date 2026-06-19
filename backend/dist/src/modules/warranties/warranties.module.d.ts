import { WarrantiesService } from './warranties.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
import { ClaimWarrantyDto, SubmitFeedbackDto } from './dto/warranties.dto';
export declare class WarrantiesController {
    private readonly warrantiesService;
    private readonly afterSalesService;
    constructor(warrantiesService: WarrantiesService, afterSalesService: AfterSalesService);
    getActiveWarranties(tenantId: string): Promise<import("./warranties.service").Warranty[]>;
    claim(id: string, dto: ClaimWarrantyDto, tenantId: string): Promise<import("./warranties.service").Warranty>;
    submitFeedback(token: string, dto: SubmitFeedbackDto): Promise<import("../after-sales/after-sales.service").AfterSales>;
}
export declare class WarrantiesModule {
}
