import { prisma } from './prisma';

interface SyncResult {
  serviceOrder: boolean;
  invoice: boolean;
  payments: number;
  accountReceivables: number;
  details: string[];
}

/**
 * Propaga a alteração do valor total de um Orçamento para todos os módulos dependentes:
 * - ServiceOrder (finalTotal)
 * - Invoice (subtotal, totalAmount) — apenas se não paga/cancelada
 * - Payment (amount) — apenas pagamentos pendentes
 * - AccountReceivable (totalAmount) — apenas títulos abertos/previstos/parciais
 *
 * Transações financeiras já registradas NÃO são alteradas (registros contábeis imutáveis).
 */
export async function syncQuotationValueToModules(
  quotationId: string,
  newTotal: number,
  oldTotal: number
): Promise<SyncResult> {
  const result: SyncResult = {
    serviceOrder: false,
    invoice: false,
    payments: 0,
    accountReceivables: 0,
    details: [],
  };

  // Guard: se o valor não mudou, não faz nada
  if (Math.abs(newTotal - oldTotal) < 0.01) {
    return result;
  }

  const diff = newTotal - oldTotal;

  try {
    // ═══════════════════════════════════════════
    // 1. ORDEM DE SERVIÇO — Sempre atualiza o finalTotal
    // ═══════════════════════════════════════════
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { quotationId },
    });

    if (serviceOrder) {
      await prisma.serviceOrder.update({
        where: { quotationId },
        data: { finalTotal: newTotal },
      });
      result.serviceOrder = true;
      result.details.push(
        `OS ${serviceOrder.number}: finalTotal R$ ${Number(serviceOrder.finalTotal).toFixed(2)} → R$ ${newTotal.toFixed(2)}`
      );
    }

    // ═══════════════════════════════════════════
    // 2. FATURA — Atualiza apenas se não paga/cancelada
    // ═══════════════════════════════════════════
    const invoice = await prisma.invoice.findFirst({
      where: { quotationId },
    });

    if (invoice && !['paga', 'cancelada'].includes(invoice.status)) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: newTotal,
          totalAmount: newTotal,
        },
      });
      result.invoice = true;
      result.details.push(
        `Fatura ${invoice.invoiceNumber}: totalAmount R$ ${Number(invoice.totalAmount).toFixed(2)} → R$ ${newTotal.toFixed(2)}`
      );
    } else if (invoice) {
      result.details.push(
        `Fatura ${invoice.invoiceNumber}: NÃO alterada (status: ${invoice.status})`
      );
    }

    // ═══════════════════════════════════════════
    // 3. PAGAMENTOS — Atualiza apenas pendentes
    // ═══════════════════════════════════════════
    const pendingPayments = await prisma.payment.findMany({
      where: {
        quotationId,
        status: 'pendente',
      },
    });

    for (const payment of pendingPayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { amount: newTotal },
      });
      result.payments++;
      result.details.push(
        `Pagamento ${payment.id.slice(-6).toUpperCase()}: amount R$ ${Number(payment.amount).toFixed(2)} → R$ ${newTotal.toFixed(2)}`
      );
    }

    // Registrar pagamentos confirmados que NÃO foram alterados
    const confirmedPayments = await prisma.payment.findMany({
      where: {
        quotationId,
        status: { not: 'pendente' },
      },
    });

    for (const payment of confirmedPayments) {
      result.details.push(
        `Pagamento ${payment.id.slice(-6).toUpperCase()}: NÃO alterado (status: ${payment.status})`
      );
    }

    // ═══════════════════════════════════════════
    // 4. CONTAS A RECEBER — Atualiza títulos em aberto vinculados à fatura
    // ═══════════════════════════════════════════
    if (invoice) {
      const openReceivables = await prisma.accountReceivable.findMany({
        where: {
          invoiceId: invoice.id,
          status: { in: ['previsto', 'aberto', 'parcial', 'vencido'] },
        },
      });

      for (const receivable of openReceivables) {
        await prisma.accountReceivable.update({
          where: { id: receivable.id },
          data: { totalAmount: newTotal },
        });
        result.accountReceivables++;
        result.details.push(
          `Conta a Receber "${receivable.title}": totalAmount R$ ${Number(receivable.totalAmount).toFixed(2)} → R$ ${newTotal.toFixed(2)}`
        );
      }
    }

    // ═══════════════════════════════════════════
    // 5. REGISTRO DE AUDITORIA
    // ═══════════════════════════════════════════
    await prisma.auditLog.create({
      data: {
        entity: 'quotation',
        entityId: quotationId,
        action: 'value_propagated',
        oldValue: { total: oldTotal },
        newValue: {
          total: newTotal,
          diff,
          propagated: {
            serviceOrder: result.serviceOrder,
            invoice: result.invoice,
            payments: result.payments,
            accountReceivables: result.accountReceivables,
          },
          details: result.details,
        },
        createdBy: 'system_sync',
      },
    });

    console.log(
      `[QUOTATION-SYNC] Orçamento ${quotationId.slice(-6).toUpperCase()}: valor propagado de R$ ${oldTotal.toFixed(2)} para R$ ${newTotal.toFixed(2)}`,
      result.details
    );
  } catch (error) {
    console.error('[QUOTATION-SYNC] Erro ao propagar valor do orçamento:', error);
  }

  return result;
}
