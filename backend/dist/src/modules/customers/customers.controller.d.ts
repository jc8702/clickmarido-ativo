import { CustomersService } from './customers.service';
import { CustomerDto, AddressDto } from './dto/customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(tenantId: string, page: string, limit: string, search: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string, tenantId: string): Promise<any>;
    create(tenantId: string, user: any, body: CustomerDto): Promise<any>;
    update(id: string, tenantId: string, user: any, body: Partial<CustomerDto>): Promise<any>;
    delete(id: string, tenantId: string, user: any): Promise<{
        success: boolean;
    }>;
    addAddress(id: string, tenantId: string, body: AddressDto): Promise<any>;
    removeAddress(id: string, addressId: string, tenantId: string): Promise<{
        success: boolean;
    }>;
}
