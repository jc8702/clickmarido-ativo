import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookProcessor } from './queue/payment-webhook.processor';
import { MercadopagoProvider } from './providers/mercadopago.provider';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentWebhookProcessor, MercadopagoProvider],
  exports: [PaymentService]
})
export class PaymentModule {}
