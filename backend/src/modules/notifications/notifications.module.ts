import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { NotificationQueue } from './queue/notification.queue';
import { TwilioSmsProvider } from './providers/twilio-sms.provider';
import { TwilioWhatsAppProvider } from './providers/twilio-whatsapp.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';

@Module({
  providers: [
    NotificationsService,
    NotificationsListener,
    NotificationQueue,
    TwilioSmsProvider,
    TwilioWhatsAppProvider,
    ResendEmailProvider,
  ],
  exports: [NotificationsService, NotificationQueue],
})
export class NotificationsModule {}
