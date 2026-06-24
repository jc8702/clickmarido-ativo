import { prisma } from '@/lib/prisma';
import { fireAndForgetNotification } from '@/lib/notifications/whatsapp';

interface AutomationResult {
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  paymentId?: string;
  error?: string;
}

export async function handleServiceOrderCompleted(
  serviceOrderId: string
): Promise<AutomationResult> {
  try {
    // 1. Fetch service order
    const serviceOrder = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: serviceOrderId },
      include: { quotation: true, customer: true },
    });

    // 1.5 Enviar notificação de WhatsApp com link do NPS para o cliente
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clickmarido-ativo-frontend.vercel.app';
    const surveyLink = `${appUrl}/survey/${serviceOrder.customerId}`;

    fireAndForgetNotification({
      phone: serviceOrder.customer.phone,
      template: 'service_order_completed',
      variables: {
        customerName: serviceOrder.customer.name,
        serviceOrderId: serviceOrder.id.slice(-6).toUpperCase(),
        surveyLink: surveyLink,
      },
    });

    // 2. Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { quotationId: serviceOrder.quotationId },
    });

    if (existingPayment) {
      return {
        status: 'skipped',
        reason: 'Payment already exists',
        paymentId: existingPayment.id,
      };
    }

    // 3. Create payment
    const payment = await prisma.payment.create({
      data: {
        quotationId: serviceOrder.quotationId,
        customerId: serviceOrder.customerId,
        amount: serviceOrder.finalTotal,
        method: 'pix',
        status: 'pendente',
        description: `Pagamento - Orçamento ${serviceOrder.quotationId.slice(-6).toUpperCase()}`,
      },
    });

    // 4. Log automation execution
    await logAutomationExecution({
      type: 'service_order.completed',
      entityId: serviceOrderId,
      action: 'create_payment',
      result: 'success',
      metadata: { paymentId: payment.id },
    });

    return {
      status: 'success',
      paymentId: payment.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAutomationExecution({
      type: 'service_order.completed',
      entityId: serviceOrderId,
      action: 'create_payment',
      result: 'error',
      metadata: { error: errorMessage },
    });

    return {
      status: 'error',
      error: errorMessage,
    };
  }
}

async function logAutomationExecution(data: {
  type: string;
  entityId: string;
  action: string;
  result: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entity: data.type.split('.')[0] || 'unknown',
        entityId: data.entityId,
        action: `${data.action}_${data.result}`,
        newValue: data.metadata || {},
        createdBy: 'system_automation',
      },
    });
  } catch (error) {
    console.error('Failed to log automation to database:', error);
  }
}
