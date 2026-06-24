import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentById, mapMpStatusToInternal, isPaymentApproved } from '@/lib/mercadopago';

// POST /api/payments/webhook-mp - Webhook Mercado Pago
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    console.log('📱 Webhook MP recebido:', JSON.stringify(body, null, 2));

    // Mercado Pago envia type + data.id
    if (body.type === 'payment') {
      const mpPaymentId = body.data?.id;

      if (!mpPaymentId) {
        console.error('❌ Webhook MP: ID do pagamento não encontrado');
        return NextResponse.json({ error: 'ID não encontrado' }, { status: 400 });
      }

      // Buscar pagamento no Mercado Pago
      const mpPayment = await getPaymentById(String(mpPaymentId));

      if (!mpPayment) {
        console.error('❌ Webhook MP: Pagamento não encontrado no MP');
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }

      console.log('💰 Pagamento MP:', {
        id: mpPayment.id,
        status: mpPayment.status,
        externalReference: mpPayment.external_reference,
        amount: mpPayment.transaction_amount,
      });

      // Buscar payment no banco pelo mpPaymentId ou external_reference
      let payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { mpPaymentId: String(mpPayment.id) },
            { id: mpPayment.external_reference || '' },
          ],
        },
        include: { invoice: true },
      });

      if (!payment && mpPayment.external_reference) {
        // Tentar buscar pela invoice
        const invoice = await prisma.invoice.findUnique({
          where: { id: mpPayment.external_reference },
        });

        if (invoice) {
          // Criar payment se não existir
          payment = await prisma.payment.create({
            data: {
              quotationId: invoice.quotationId,
              customerId: invoice.customerId,
              amount: mpPayment.transaction_amount || 0,
              method: mpPayment.payment_method_id || 'pix',
              status: mapMpStatusToInternal(mpPayment.status || ''),
              mpPaymentId: String(mpPayment.id),
              mpStatus: mpPayment.status || '',
              mpPaymentMethodId: mpPayment.payment_method_id,
              mpExternalReference: mpPayment.external_reference,
              description: `Pagamento MP #${mpPayment.id}`,
            },
            include: { invoice: true },
          });
        }
      }

      if (payment) {
        // Atualizar status do pagamento
        const internalStatus = mapMpStatusToInternal(mpPayment.status || '');
        const oldStatus = payment.status;

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: internalStatus,
            mpStatus: mpPayment.status || '',
            confirmedAt: isPaymentApproved(mpPayment.status || '') ? new Date() : null,
            paidAt: isPaymentApproved(mpPayment.status || '') ? new Date() : payment.paidAt,
          },
        });

        // Registrar auditoria do pagamento
        await prisma.auditLog.create({
          data: {
            entity: 'payment',
            entityId: payment.id,
            action: 'updated',
            oldValue: { status: oldStatus },
            newValue: { status: internalStatus },
            createdBy: 'system_automation',
          },
        });

        // Se pagamento aprovado, atualizar invoice
        if (isPaymentApproved(mpPayment.status || '') && payment.invoiceId) {
          // Verificar se todos os pagamentos da invoice foram confirmados
          const allPayments = await prisma.payment.findMany({
            where: { invoiceId: payment.invoiceId },
          });

          const allConfirmed = allPayments.every(
            (p) => p.status === 'confirmado' || p.id === payment.id
          );

          if (allConfirmed) {
            const oldInvoice = payment.invoice;
            await prisma.invoice.update({
              where: { id: payment.invoiceId },
              data: { status: 'paga' },
            });

            // Registrar auditoria da invoice
            await prisma.auditLog.create({
              data: {
                entity: 'invoice',
                entityId: payment.invoiceId,
                action: 'updated',
                oldValue: { status: oldInvoice?.status },
                newValue: { status: 'paga' },
                createdBy: 'system_automation',
              },
            });

            console.log(`✅ Invoice ${payment.invoiceId} marcada como paga`);
          }
        }

        // Criar transação financeira para auditoria
        await prisma.financialTransaction.create({
          data: {
            type: 'PAYMENT_RECEIVED',
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            credit: mpPayment.transaction_amount || 0,
            description: `Pagamento recebido via ${mpPayment.payment_method_id}`,
            transactionDate: new Date(),
          },
        });

        console.log(`✅ Pagamento ${payment.id} atualizado: ${internalStatus}`);
      } else {
        console.log('⚠️ Pagamento não encontrado no banco, ignorando webhook');
      }
    }

    // Sempre retornar 200 para o Mercado Pago não reenviar
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Erro no webhook MP:', error);
    // Retornar 200 mesmo com erro para não reenviar
    return NextResponse.json({ received: true });
  }
}
