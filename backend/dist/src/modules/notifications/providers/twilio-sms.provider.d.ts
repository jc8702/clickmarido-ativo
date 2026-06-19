import { ISmsProvider } from './notification-provider.interface';
export declare class TwilioSmsProvider implements ISmsProvider {
    sendSms(to: string, message: string): Promise<{
        success: boolean;
        messageId: string;
        error?: any;
    }>;
}
