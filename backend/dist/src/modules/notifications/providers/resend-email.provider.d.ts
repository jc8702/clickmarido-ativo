import { IEmailProvider } from './notification-provider.interface';
export declare class ResendEmailProvider implements IEmailProvider {
    sendEmail(to: string, subject: string, body: string): Promise<{
        success: boolean;
        messageId: string;
        error?: any;
    }>;
}
