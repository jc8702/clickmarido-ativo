import { IWhatsAppProvider } from './notification-provider.interface';
export declare class TwilioWhatsAppProvider implements IWhatsAppProvider {
    sendWhatsApp(to: string, message: string): Promise<{
        success: boolean;
        messageId: string;
        error?: any;
    }>;
}
