import { CreateServiceOrderDto, CompleteServiceOrderDto, CancelServiceOrderDto, UploadPhotosDto } from './dto/service-order.dto';
export declare class ServiceOrdersService {
    private assignmentStrategy;
    constructor();
    findAll(tenantId: string, status?: string): Promise<any[]>;
    findById(id: string, tenantId: string): Promise<any>;
    create(tenantId: string, dto: CreateServiceOrderDto): Promise<{
        id: string;
        number: string;
        tenantId: string;
        quotation_id: any;
        customer_id: string;
        technician_id: string;
        address_id: string;
        scheduled_date: Date;
        scheduled_time: any;
        status: string;
        arrival_time: null;
        completion_time: null;
        before_photos: never[];
        after_photos: never[];
        final_total: null;
        created_at: Date;
    }>;
    start(id: string, tenantId: string, userId: string): Promise<any>;
    uploadPhotos(id: string, tenantId: string, dto: UploadPhotosDto): Promise<any>;
    complete(id: string, tenantId: string, dto: CompleteServiceOrderDto): Promise<any>;
    cancel(id: string, tenantId: string, dto: CancelServiceOrderDto): Promise<any>;
}
