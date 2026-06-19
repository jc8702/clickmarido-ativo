import { z } from 'zod';
export declare const QuotationItemSchema: any;
export declare const QuotationSchema: any;
export type QuotationDto = z.infer<typeof QuotationSchema>;
export type QuotationItemDto = z.infer<typeof QuotationItemSchema>;
