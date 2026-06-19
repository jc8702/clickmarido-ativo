import { Injectable } from '@nestjs/common';
import { IEmailProvider } from './notification-provider.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId: string; error?: any }> {
    console.log(`[ResendEmailProvider] Enviando E-mail para ${to} | Assunto: ${subject}`);

    if (to && to.includes('fail-email')) {
      return { success: false, messageId: '', error: 'Resend API Limit Exceeded' };
    }

    return {
      success: true,
      messageId: `email_${Math.random().toString(36).substring(7)}`,
    };
  }
}
