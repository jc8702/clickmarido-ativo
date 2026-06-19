import { QuotationsService } from './quotations.service';
import { QuotationDto } from './dto/quotation.dto';
export declare class QuotationsController {
    private readonly quotationsService;
    constructor(quotationsService: QuotationsService);
    getPublicView(token: string): Promise<{
        id: any;
        number: any;
        items: any;
        subtotal: any;
        discount: any;
        total: any;
        valid_until: any;
        status: any;
        customer_id: any;
    }>;
    approveByCustomer(token: string): Promise<{
        success: boolean;
        status: any;
        message: string;
    }>;
    findAll(tenantId: string, status: string): Promise<any[]>;
    findById(id: string, tenantId: string): Promise<any>;
    create(tenantId: string, user: any, body: QuotationDto): Promise<{
        id: string;
        number: string;
        tenantId: string;
        created_by: string;
        customer_id: any;
        items: any;
        subtotal: any;
        discount: any;
        total: number;
        status: string;
        valid_until: Date;
        approval_link: string;
        created_at: Date;
    }>;
    update(id: string, tenantId: string, body: Partial<QuotationDto>): Promise<any>;
    send(id: string, tenantId: string, method: 'email' | 'whatsapp'): Promise<{
        success: boolean;
        status: any;
    }>;
}
