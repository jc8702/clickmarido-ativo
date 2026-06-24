import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { fireAndForgetNotification } from '@/lib/notifications/whatsapp';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validate Asaas signature
    const signature = request.headers.get('asaas-signature');
    const body = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      console.warn('[WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(body);

    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    // 3. Find payment in DB
    const payment = await prisma.payment.findFirst({
      where: { pixCode: payload.pixCode },
      include: { quotation: true, customer: true },
    });

    if (!payment) {
      console.warn(`[WEBHOOK] Payment not found for pixCode: ${payload.pixCode}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 4. Update payment status
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'pago',
        paidAt: new Date(payload.confirmedDate || new Date()),
      },
      include: { quotation: true, customer: true },
    });

    // Registrar auditoria do pagamento
    await prisma.auditLog.create({
      data: {
        entity: 'payment',
        entityId: payment.id,
        action: 'updated',
        newValue: { status: 'pago', paidAt: updated.paidAt },
        createdBy: 'system_automation',
      },
    });

    // 4.5 Generate Invoice if it doesn't exist
    if (payment.quotationId) {
      try {
        const existingInvoice = await prisma.invoice.findUnique({
          where: { quotationId: payment.quotationId },
        });

        if (!existingInvoice) {
          // Buscar a última invoice para gerar a numeração sequencial
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

          // Criar a Invoice
          const subtotal = updated.amount;
          const taxAmount = subtotal * 0.02; // Exemplo de ISS fictício de 2%
          const totalAmount = subtotal + taxAmount;

          const invoice = await prisma.invoice.create({
            data: {
              quotationId: payment.quotationId,
              customerId: payment.customerId,
              invoiceNumber: nextNumber,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de vencimento
              subtotal,
              taxAmount,
              totalAmount,
              status: 'gerada',
              description: `Nota fiscal referente ao pagamento do orçamento ${payment.quotationId.slice(-6).toUpperCase()}`,
            },
          });

          // Vincular Invoice ao Payment
          await prisma.payment.update({
            where: { id: payment.id },
            data: { invoiceId: invoice.id },
          });

          // Registrar em AuditLog
          await prisma.auditLog.create({
            data: {
              entity: 'invoice',
              entityId: invoice.id,
              action: 'auto_generated_from_payment',
              newValue: { invoiceNumber: nextNumber, total: totalAmount },
              createdBy: 'system_automation',
            },
          });

          console.log(`[AUTOMATION] Invoice ${nextNumber} gerada automaticamente para o pagamento ${payment.id}`);
        }
      } catch (error) {
        console.error('[AUTOMATION ERROR] Falha ao autogerar Invoice:', error);
      }
    }

    // 5. Update service order to 'concluida' (sem acento para consistência com o banco)
    if (payment.quotationId) {
      const affectedOS = await prisma.serviceOrder.findMany({
        where: { quotationId: payment.quotationId },
        select: { id: true, number: true, status: true },
      });

      await prisma.serviceOrder.updateMany({
        where: { quotationId: payment.quotationId },
        data: { status: 'concluida' },
      });

      for (const os of affectedOS) {
        await prisma.auditLog.create({
          data: {
            entity: 'service_order',
            entityId: os.id,
            action: 'completed_via_payment_webhook',
            oldValue: { status: os.status },
            newValue: { status: 'concluida' },
            createdBy: 'system_automation',
          },
        });
      }
    }

    // 6. Send notification (non-blocking)
    fireAndForgetNotification({
      phone: updated.customer.phone,
      template: 'payment_received',
      variables: {
        customer_name: updated.customer.name,
        amount: `R$ ${updated.amount.toFixed(2)}`,
      },
    });

    // 7. Log
    console.log('[WEBHOOK] Payment received:', {
      paymentId: payment.id,
      amount: updated.amount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK] Error processing payment:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
