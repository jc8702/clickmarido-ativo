import { ExecutionContext } from '@nestjs/common';
declare const JwtGuard_base: any;
export declare class JwtGuard extends JwtGuard_base {
    canActivate(context: ExecutionContext): any;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
