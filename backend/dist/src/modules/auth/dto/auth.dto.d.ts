import { z } from 'zod';
export declare const RegisterSchema: any;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: any;
export type LoginDto = z.infer<typeof LoginSchema>;
export declare const RefreshSchema: any;
export type RefreshDto = z.infer<typeof RefreshSchema>;
