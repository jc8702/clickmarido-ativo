import { z } from 'zod';
export declare const CreateServiceOrderSchema: any;
export declare const CompleteServiceOrderSchema: any;
export declare const CancelServiceOrderSchema: any;
export declare const UploadPhotosSchema: any;
export type CreateServiceOrderDto = z.infer<typeof CreateServiceOrderSchema>;
export type CompleteServiceOrderDto = z.infer<typeof CompleteServiceOrderSchema>;
export type CancelServiceOrderDto = z.infer<typeof CancelServiceOrderSchema>;
export type UploadPhotosDto = z.infer<typeof UploadPhotosSchema>;
