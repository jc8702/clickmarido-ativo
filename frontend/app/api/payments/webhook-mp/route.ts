import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getPaymentById,
  mapMpStatusToInternal,
  isPaymentApproved,
  validateMpWebhookSignature,
} from '@/lib/mercadopago';

// POST /api/payments/webhook-mp - Webhook Mercado Pago
// Com validação de assinatura e idempotência
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.text();

    // 1. Validar assinatura HMAC do Mercado Pago
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[WEBHOOK MP] MERCADO_PAGO_WEBHOOK_SECRET não configurado');
      // Retornar 200 para não causar retry infinito, mas logar erro crítico
      return NextResponse.json({ received: true, error: 'Webhook secret not configured' });
    }

    if (!validateMpWebhookSignature(body, signature, webhookSecret)) {
      console.warn('[WEBHOOK MP] Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // 2. Mercado Pago envia type + data.id
    if (payload.type !== 'payment') {
      return NextResponse.json({ received: true, status: 'ignored' });
    }

    const mpPaymentId = payload.data?.id;

    if (!mpPaymentId) {
      console.error('[WEBHOOK MP] ID do pagamento não encontrado');
      return NextResponse.json({ received: true, error: 'Missing payment ID' });
    }

    // 3. Idempotência: verificar se este pagamento já foi processado recentemente
    const existingPayment = await prisma.payment.findFirst({
      where: { mpPaymentId: String(mpPaymentId) },
      select: { id: true, status: true, mpStatus: true },
    });

    // 4. Buscar pagamento no Mercado Pago
    const mpPayment = await getPaymentById(String(mpPaymentId));

    if (!mpPayment) {
      console.error('[WEBHOOK MP] Pagamento não encontrado no MP');
      return NextResponse.json({ received: true, error: 'Payment not found in MP' });
    }

    const mpStatus = (mpPayment as any).status || '';
    const internalStatus = mapMpStatusToInternal(mpStatus);

    // 5. Idempotência: se já temos o pagamento e o status não mudou, ignorar
    if (existingPayment && existingPayment.status === internalStatus) {
      console.log(`[WEBHOOK MP] Pagamento ${mpPaymentId} já processado com status ${internalStatus}`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    console.log('[WEBHOOK MP] Processando pagamento:', {
      id: mpPaymentId,
      mpStatus,
      internalStatus,
      amount: (mpPayment as any).transaction_amount,
    });

    // 6. Buscar ou criar payment no banco
    let payment = existingPayment
      ? await prisma.payment.findUnique({
          where: { id: existingPayment.id },
          include: { invoice: true },
        })
      : null;

    if (!payment) {
      // Buscar pelo external_reference
      const externalRef = (mpPayment as any).external_reference;
      if (externalRef) {
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { id: externalRef },
              { invoiceId: externalRef },
            ],
          },
          include: { invoice: true },
        });
      }
    }

    // Criar payment se não existir
    if (!payment) {
      const invoiceId = (mpPayment as any).external_reference;
      const invoice = invoiceId
        ? await prisma.invoice.findUnique({ where: { id: invoiceId } })
        : null;

      if (invoice) {
        payment = await prisma.payment.create({
          data: {
            quotationId: invoice.quotationId,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
            amount: (mpPayment as any).transaction_amount || 0,
            method: (mpPayment as any).payment_method_id || 'pix',
            status: internalStatus,
            mpPaymentId: String(mpPaymentId),
            mpStatus,
            mpPaymentMethodId: (mpPayment as any).payment_method_id,
            mpExternalReference: (mpPayment as any).external_reference,
            description: `Pagamento MP #${mpPaymentId}`,
          },
          include: { invoice: true },
        });
      }
    }

    if (!payment) {
      console.warn(`[WEBHOOK MP] Pagamento ${mpPaymentId} não encontrado no banco`);
      return NextResponse.json({ received: true, status: 'payment_not_in_db' });
    }

    // 7. Atualizar status (idempotente - só atualiza se mudou)
    const oldStatus = payment.status;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment!.id },
        data: {
          status: internalStatus,
          mpStatus,
          confirmedAt: isPaymentApproved(mpStatus) ? new Date() : payment!.confirmedAt,
          paidAt: isPaymentApproved(mpStatus) ? new Date() : payment!.paidAt,
        },
      });

      // Auditoria (só se status mudou)
      if (oldStatus !== internalStatus) {
        await tx.auditLog.create({
          data: {
            entity: 'payment',
            entityId: payment!.id,
            action: 'updated',
            oldValue: { status: oldStatus },
            newValue: { status: internalStatus },
            createdBy: 'system_webhook_mp',
          },
        });
      }

      // 8. Se pagamento aprovado, verificar invoice
      if (isPaymentApproved(mpStatus) && payment!.invoiceId) {
        const allPayments = await tx.payment.findMany({
          where: { invoiceId: payment!.invoiceId },
        });

        const allConfirmed = allPayments.every(
          (p) => p.status === 'confirmado' || p.id === payment!.id
        );

        if (allConfirmed) {
          const invoice = await tx.invoice.findUnique({
            where: { id: payment!.invoiceId },
          });

          if (invoice && invoice.status !== 'paga') {
            await tx.invoice.update({
              where: { id: payment!.invoiceId },
              data: { status: 'paga' },
            });

            await tx.auditLog.create({
              data: {
                entity: 'invoice',
                entityId: payment!.invoiceId,
                action: 'updated',
                oldValue: { status: invoice.status },
                newValue: { status: 'paga' },
                createdBy: 'system_webhook_mp',
              },
            });
          }
        }
      }

      // 8.1. Se pagamento aprovado, atualizar OS vinculada para 'concluida'
      if (isPaymentApproved(mpStatus) && payment!.quotationId) {
        const affectedOS = await tx.serviceOrder.findMany({
          where: { quotationId: payment!.quotationId },
          select: { id: true, number: true, status: true },
        });

        const pendingOS = affectedOS.filter((os) => os.status !== 'concluida');

        if (pendingOS.length > 0) {
          await tx.serviceOrder.updateMany({
            where: { quotationId: payment!.quotationId },
            data: { 
              status: 'concluida',
              completedAt: new Date()
            },
          });

          for (const os of pendingOS) {
            await tx.auditLog.create({
              data: {
                entity: 'service_order',
                entityId: os.id,
                action: 'completed_via_payment_webhook_mp',
                oldValue: { status: os.status },
                newValue: { status: 'concluida' },
                createdBy: 'system_webhook_mp',
              },
            });
          }
        }
      }

      // 9. Criar transação financeira (idempotente - verificar se já existe)
      const existingTransaction = await tx.financialTransaction.findFirst({
        where: {
          paymentId: payment!.id,
          type: 'PAYMENT_RECEIVED',
        },
      });

      if (!existingTransaction) {
        await tx.financialTransaction.create({
          data: {
            type: 'PAYMENT_RECEIVED',
            paymentId: payment!.id,
            invoiceId: payment!.invoiceId,
            credit: (mpPayment as any).transaction_amount || 0,
            description: `Pagamento recebido via ${(mpPayment as any).payment_method_id}`,
            transactionDate: new Date(),
          },
        });
      }
    });

    console.log(`[WEBHOOK MP] Pagamento ${payment.id} processado: ${internalStatus}`);

    // Sempre retornar 200 para o Mercado Pago não reenviar
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK MP] Erro processando webhook:', error);
    // Retornar 200 mesmo com erro para não causar retry infinito
    return NextResponse.json({ received: true });
  }
}
