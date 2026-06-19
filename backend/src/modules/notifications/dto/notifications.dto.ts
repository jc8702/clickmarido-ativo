export interface SendSmsDto {
  to: string;
  message: string;
  notification_id: string;
}

export interface SendWhatsAppDto {
  to: string;
  message: string;
  notification_id: string;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  notification_id: string;
}
