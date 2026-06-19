import { z } from 'zod';
export declare const CreateInventoryItemSchema: any;
export declare const ReserveInventorySchema: any;
export declare const ConsumeInventorySchema: any;
export type CreateInventoryItemDto = z.infer<typeof CreateInventoryItemSchema>;
export type ReserveInventoryDto = z.infer<typeof ReserveInventorySchema>;
export type ConsumeInventoryDto = z.infer<typeof ConsumeInventorySchema>;
