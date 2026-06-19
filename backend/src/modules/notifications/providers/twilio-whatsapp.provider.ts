import { Injectable } from '@nestjs/common';
import { IWhatsAppProvider } from './notification-provider.interface';

@Injectable()
export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  async sendWhatsApp(to: string, message: string): Promise<{ success: boolean; messageId: string; error?: any }> {
    console.log(`[TwilioWhatsAppProvider] Enviando WhatsApp para ${to}: "${message}"`);

    if (to && to.includes('fail-wa')) {
      return { success: false, messageId: '', error: 'Twilio WhatsApp Gateway Error' };
    }

    return {
      success: true,
      messageId: `wa_${Math.random().toString(36).substring(7)}`,
    };
  }
}
