import { z } from 'zod';
export declare const AddressSchema: any;
export declare const CustomerSchema: any;
export type CustomerDto = z.infer<typeof CustomerSchema>;
export type AddressDto = z.infer<typeof AddressSchema>;
