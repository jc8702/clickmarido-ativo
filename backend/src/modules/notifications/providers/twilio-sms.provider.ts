import { Injectable } from '@nestjs/common';
import { ISmsProvider } from './notification-provider.interface';

@Injectable()
export class TwilioSmsProvider implements ISmsProvider {
  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId: string; error?: any }> {
    console.log(`[TwilioSmsProvider] Enviando SMS para ${to}: "${message}"`);
    
    // Simula uma pequena taxa de erro intermitente para os testes de retry se necessário,
    // ou apenas sucesso por padrão. Podemos customizar nos testes E2E injetando mock.
    if (to && to.includes('fail-sms')) {
      return { success: false, messageId: '', error: 'Twilio SMS Gateway Timeout' };
    }

    return {
      success: true,
      messageId: `sms_${Math.random().toString(36).substring(7)}`,
    };
  }
}
