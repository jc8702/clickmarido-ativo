export interface ISmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId: string; error?: any }>;
}

export interface IWhatsAppProvider {
  sendWhatsApp(to: string, message: string): Promise<{ success: boolean; messageId: string; error?: any }>;
}

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId: string; error?: any }>;
}
