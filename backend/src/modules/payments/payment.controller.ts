import { Controller, Get, Post, Body, Param, UseGuards, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentWebhookProcessor } from './queue/payment-webhook.processor';
import { MercadopagoProvider } from './providers/mercadopago.provider';
import { CreatePaymentDto, CreatePaymentSchema, RefundPaymentDto, RefundPaymentSchema } from './dto/payment.dto';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { JwtGuard } from '../../shared/guards/jwt.guard';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';

@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookProcessor: PaymentWebhookProcessor,
    private readonly mpProvider: MercadopagoProvider
  ) {}

  // ==========================================
  // Rotas Privadas
  // ==========================================
  
  @UseGuards(TenantGuard, JwtGuard)
  @Post('payments')
  async create(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreatePaymentSchema)) body: CreatePaymentDto
  ) {
    return this.paymentService.create(tenantId, body);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Get('payments/:id')
  async getStatus(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.paymentService.getPaymentStatus(id, tenantId);
  }

  @UseGuards(TenantGuard, JwtGuard)
  @Post('payments/:id/refund')
  async refund(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(RefundPaymentSchema)) body: RefundPaymentDto
  ) {
    return this.paymentService.refund(id, tenantId, body);
  }

  // ==========================================
  // Webhook (Público, Validado por HMAC)
  // ==========================================
  
  @Post('webhooks/mercadopago')
  async handleWebhook(
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Body() body: any
  ) {
    // 1. Validação Criptográfica Pura do Webhook
    const dataId = body?.data?.id || '';
    const isValid = this.mpProvider.validateWebhookSignature(xSignature, xRequestId, dataId);

    if (!isValid) {
      console.warn(`[WEBHOOK BLOCK] Assinatura inválida detectada! reqId: ${xRequestId}`);
      throw new HttpException('Assinatura HMAC inválida', HttpStatus.FORBIDDEN);
    }

    // 2. Extração dos dados
    const action = body?.action; // 'payment.created', 'payment.updated'
    const status = body?.data?.status; // 'approved', 'rejected'
    const paymentId = body?.data?.id; // ID do MP
    
    // MP envia vários tipos, focamos em update de payment
    if (action?.includes('payment') && status) {
      // 3. Joga na Fila para não segurar o MP
      // (TenantId seria deduzido consultando o banco pelo paymentId, usando mock-tenant aqui)
      await this.webhookProcessor.enqueueWebhookPayload(paymentId, status, 'tenant-a-123');
    }

    // MP exige retorno 200/201 super rápido (<2s)
    return { received: true };
  }
}
