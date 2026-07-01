import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { fireAndForgetNotification } from '@/lib/notifications/whatsapp';
import { logFinancialTransaction } from '@/lib/finance-sync';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validar assinatura HMAC do Asaas
    const signature = request.headers.get('asaas-signature');
    const body = await request.text();

    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    // Falhar explicitamente se secret não configurado
    if (!webhookSecret) {
      console.error('[WEBHOOK ASAAS] ASAAS_WEBHOOK_SECRET não configurado');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      console.warn('[WEBHOOK ASAAS] Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(body);

    // 3. Ignorar eventos que não são de pagamento
    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    // 4. Idempotência: verificar se este pagamento já foi processado
    const payment = await prisma.payment.findFirst({
      where: { pixCode: payload.pixCode },
      include: { quotation: true, customer: true },
    });

    if (!payment) {
      console.warn(`[WEBHOOK ASAAS] Pagamento não encontrado para pixCode: ${payload.pixCode}`);
      return NextResponse.json({ received: true, status: 'payment_not_found' });
    }

    // 5. Idempotência: se já está pago, ignorar
    if (payment.status === 'confirmado') {
      console.log(`[WEBHOOK ASAAS] Pagamento ${payment.id} já processado`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // 6. Atualizar status do pagamento
    const oldStatus = payment.status;
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'confirmado',
        paidAt: new Date(payload.confirmedDate || new Date()),
      },
      include: { quotation: true, customer: true },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        entity: 'payment',
        entityId: payment.id,
        action: 'updated',
        oldValue: { status: oldStatus },
        newValue: { status: 'confirmado' },
        createdBy: 'system_webhook_asaas',
      },
    });

    await logFinancialTransaction({
      type: 'PAYMENT_RECEIVED',
      paymentId: payment.id,
      credit: Number(updated.amount),
      description: `Pagamento recebido via webhook Asaas (${updated.method || 'pix'})`,
    });

    // 7. Gerar Invoice se não existir (idempotente)
    if (payment.quotationId) {
      try {
        const existingInvoice = await prisma.invoice.findUnique({
          where: { quotationId: payment.quotationId },
        });

        if (!existingInvoice) {
          // Buscar última invoice para numeração sequencial
          const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { invoiceNumber: 'desc' },
            select: { invoiceNumber: true },
          });

          let nextNumber = 'INV-0001';
          if (lastInvoice) {
            const numStr = lastInvoice.invoiceNumber.replace('INV-', '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
              nextNumber = `INV-${String(num + 1).padStart(4, '0')}`;
            }
          }

          const subtotal = Number(updated.amount);
          const taxAmount = subtotal * 0.02;
          const totalAmount = subtotal + taxAmount;

          const invoice = await prisma.invoice.create({
            data: {
              quotationId: payment.quotationId,
              customerId: payment.customerId,
              invoiceNumber: nextNumber,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              subtotal,
              taxAmount,
              totalAmount,
              status: 'emitida',
              description: `Nota fiscal referente ao pagamento do orçamento ${payment.quotationId.slice(-6).toUpperCase()}`,
            },
          });

          // Vincular Invoice ao Payment
          await prisma.payment.update({
            where: { id: payment.id },
            data: { invoiceId: invoice.id },
          });

          await prisma.auditLog.create({
            data: {
              entity: 'invoice',
              entityId: invoice.id,
              action: 'auto_generated_from_payment',
              newValue: { invoiceNumber: nextNumber, total: totalAmount },
              createdBy: 'system_webhook_asaas',
            },
          });

          console.log(`[WEBHOOK ASAAS] Invoice ${nextNumber} gerada para pagamento ${payment.id}`);
        }
      } catch (error) {
        console.error('[WEBHOOK ASAAS] Erro ao gerar invoice:', error);
      }
    }

    // 8. Atualizar OS para 'concluida'
    if (payment.quotationId) {
      const affectedOS = await prisma.serviceOrder.findMany({
        where: { quotationId: payment.quotationId },
        select: { id: true, number: true, status: true },
      });

      // Só atualizar se não estiver já concluída
      const pendingOS = affectedOS.filter((os) => os.status !== 'concluida');

      if (pendingOS.length > 0) {
        await prisma.serviceOrder.updateMany({
          where: { quotationId: payment.quotationId },
          data: { status: 'concluida' },
        });

        for (const os of pendingOS) {
          await prisma.auditLog.create({
            data: {
              entity: 'service_order',
              entityId: os.id,
              action: 'completed_via_payment_webhook',
              oldValue: { status: os.status },
              newValue: { status: 'concluida' },
              createdBy: 'system_webhook_asaas',
            },
          });
        }
      }
    }

    // 9. Enviar notificação (não bloqueante)
    if (updated.customer?.phone) {
      fireAndForgetNotification({
        phone: updated.customer.phone,
        template: 'payment_received',
        variables: {
          customer_name: updated.customer.name,
          amount: `R$ ${updated.amount.toFixed(2)}`,
        },
      });
    }

    console.log('[WEBHOOK ASAAS] Pagamento processado:', {
      paymentId: payment.id,
      amount: updated.amount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK ASAAS] Erro processando webhook:', error);
    // Retornar 200 para não causar retry infinito
    return NextResponse.json({ received: true });
  }
}
