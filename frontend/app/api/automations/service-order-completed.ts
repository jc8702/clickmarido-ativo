import { prisma } from '@/lib/prisma';
import { syncPaymentReceived } from '@/lib/finance-sync';
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

    // Notificação foi movida para o CRON de NPS (24h após execução)

    // 2. Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { quotationId: serviceOrder.quotationId },
    });

    if (existingPayment && existingPayment.invoiceId) {
      return {
        status: 'skipped',
        reason: 'Payment already exists and is fully integrated',
        paymentId: existingPayment.id,
      };
    }

    const now = new Date();

    // 3. Create payment (or update existing) and integrate with financial module
    const result = await prisma.$transaction(async (tx) => {
      let payment = existingPayment;

      if (!payment) {
        payment = await tx.payment.create({
          data: {
            quotationId: serviceOrder.quotationId,
            customerId: serviceOrder.customerId,
            amount: serviceOrder.finalTotal,
            method: 'pix',
            status: 'confirmado',
            paidAt: now,
            confirmedAt: now,
            description: `Pagamento - Orçamento ${serviceOrder.quotationId.slice(-6).toUpperCase()}`,
          },
        });
      }

      // Create invoice for the payment
      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;

      const invoice = await tx.invoice.create({
        data: {
          customerId: serviceOrder.customerId,
          invoiceNumber,
          issueDate: payment.createdAt || now,
          dueDate: payment.createdAt || now,
          subtotal: payment.amount,
          totalAmount: payment.amount,
          status: 'paga',
          description: `Fatura gerada automaticamente ao concluir OS`,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { invoiceId: invoice.id },
      });

      // Create financial transaction (credit)
      await tx.financialTransaction.create({
        data: {
          type: 'PAYMENT_RECEIVED',
          paymentId: payment.id,
          invoiceId: invoice.id,
          credit: payment.amount,
          debit: 0,
          description: `Recebimento de Pagamento #${payment.id.slice(-6).toUpperCase()} (PIX)`,
          transactionDate: now,
        },
      });

      // Sync with bank account and accounts receivable
      await syncPaymentReceived(payment.id, tx);

      return payment;
    });

    // 4. Log automation execution
    await logAutomationExecution({
      type: 'service_order.completed',
      entityId: serviceOrderId,
      action: 'create_payment',
      result: 'success',
      metadata: { paymentId: result.id },
    });

    return {
      status: 'success',
      paymentId: result.id,
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
