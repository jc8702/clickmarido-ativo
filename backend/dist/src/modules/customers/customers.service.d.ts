import { CustomerDto, AddressDto } from './dto/customer.dto';
export declare class CustomersService {
    findAll(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string, tenantId: string): Promise<any>;
    create(tenantId: string, userId: string, dto: CustomerDto): Promise<any>;
    update(id: string, tenantId: string, userId: string, dto: Partial<CustomerDto>): Promise<any>;
    delete(id: string, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    addAddress(customerId: string, tenantId: string, address: AddressDto): Promise<any>;
    removeAddress(customerId: string, addressId: string, tenantId: string): Promise<{
        success: boolean;
    }>;
}
