import { prisma } from './prisma';

export async function logFinancialTransaction(params: {
  type: 'INVOICE_ISSUED' | 'PAYMENT_RECEIVED' | 'EXPENSE_RECORDED' | 'EXPENSE_PAID' | 'EXPENSE_REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  invoiceId?: string;
  paymentId?: string;
  expenseId?: string;
  debit?: number;
  credit?: number;
  description: string;
  notes?: string;
  userId?: string;
  userEmail?: string;
}) {
  try {
    const debit = params.debit || 0;
    const credit = params.credit || 0;

    // Buscar a última transação para calcular o saldo acumulado
    const lastTransaction = await prisma.financialTransaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });

    const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
    const newBalance = prevBalance + credit - debit;

    await prisma.financialTransaction.create({
      data: {
        type: params.type,
        invoiceId: params.invoiceId,
        paymentId: params.paymentId,
        expenseId: params.expenseId,
        debit,
        credit,
        balance: newBalance,
        description: params.description,
        notes: params.notes,
        userId: params.userId,
        userEmail: params.userEmail,
      },
    });
  } catch (error) {
    console.error('Error logging financial transaction:', error);
  }
}

/**
 * Sincroniza um pagamento recebido:
 * 1. Atualiza o saldo da conta bancária padrão ou ativa.
 * 2. Dá baixa (ou cria baixa) no Contas a Receber (AccountReceivable).
 */
export async function syncPaymentReceived(paymentId: string, tx: any) {
  try {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, quotation: true }
    });

    if (!payment || payment.status !== 'confirmado') {
      return;
    }

    const amount = Number(payment.amount);
    if (amount <= 0) return;

    // 1. Localizar a conta bancária para receber o valor (preferência pela padrão ativa)
    let bankAccount = await tx.bankAccount.findFirst({
      where: { isDefault: true, status: 'ativa' }
    });

    if (!bankAccount) {
      bankAccount = await tx.bankAccount.findFirst({
        where: { status: 'ativa' }
      });
    }

    if (!bankAccount) {
      console.warn('[FINANCE-SYNC] Nenhuma conta bancária ativa encontrada para receber o pagamento');
      return;
    }

    // 2. Atualizar o saldo da conta bancária (currentBalance)
    await tx.bankAccount.update({
      where: { id: bankAccount.id },
      data: {
        currentBalance: {
          increment: amount
        }
      }
    });

    // 3. Buscar ou criar o lançamento no Contas a Receber (AccountReceivable)
    let receivable = null;
    if (payment.invoiceId) {
      receivable = await tx.accountReceivable.findFirst({
        where: {
          invoiceId: payment.invoiceId,
          status: { in: ['previsto', 'aberto', 'parcial', 'vencido'] }
        }
      });
    }

    if (!receivable && payment.quotationId) {
      receivable = await tx.accountReceivable.findFirst({
        where: {
          OR: [
            { invoice: { quotationId: payment.quotationId } },
            { notes: { contains: payment.quotationId } }
          ],
          status: { in: ['previsto', 'aberto', 'parcial', 'vencido'] }
        }
      });
    }

    if (receivable) {
      const newPaidAmount = Number(receivable.paidAmount) + amount;
      const totalAmount = Number(receivable.totalAmount);
      const newStatus = newPaidAmount >= totalAmount ? 'baixado' : 'parcial';

      await tx.accountReceivable.update({
        where: { id: receivable.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          bankAccountId: bankAccount.id,
          paidDate: payment.paidAt || new Date(),
          paymentMethod: payment.method.toUpperCase(),
          notes: `${receivable.notes || ''}\n[BAIXA AUTOMÁTICA] Recebido R$ ${amount.toFixed(2)} via ${payment.method.toUpperCase()}.`.trim()
        }
      });
    } else {
      // Criar um novo lançamento de Contas a Receber já baixado para fins de histórico
      await tx.accountReceivable.create({
        data: {
          title: payment.description || `Recebimento de Fatura #${payment.invoiceId || ''}`,
          description: `Recebimento automático via webhook/aprovação. Pagamento ID: ${payment.id}`,
          totalAmount: amount,
          paidAmount: amount,
          status: 'baixado',
          dueDate: payment.createdAt,
          paidDate: payment.paidAt || new Date(),
          origin: payment.invoiceId ? 'FATURAMENTO' : 'MANUAL',
          paymentMethod: payment.method.toUpperCase(),
          bankAccountId: bankAccount.id,
          customerId: payment.customerId,
          invoiceId: payment.invoiceId,
          notes: `Gerado automaticamente via conciliação de pagamento.`
        }
      });
    }

    // 4. Criar registro de conciliação bancária
    await tx.bankReconciliation.create({
      data: {
        bankAccountId: bankAccount.id,
        transactionDate: payment.paidAt || new Date(),
        description: `Recebimento - ${payment.description || 'Pagamento'}`,
        amount: amount,
        type: 'ENTRADA',
        isReconciled: true,
        reconciledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error syncing payment received:', error);
  }
}

/**
 * Sincroniza uma despesa paga:
 * 1. Atualiza o saldo da conta bancária padrão ou ativa debitando o valor.
 * 2. Dá baixa (ou cria baixa) no Contas a Pagar (AccountPayable).
 */
export async function syncExpensePaid(expenseId: string, tx: any) {
  try {
    const expense = await tx.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense || expense.status !== 'paga') {
      return;
    }

    const amount = Number(expense.amount);
    if (amount <= 0) return;

    // 1. Localizar a conta bancária para debitar o valor (preferência pela padrão ativa)
    let bankAccount = await tx.bankAccount.findFirst({
      where: { isDefault: true, status: 'ativa' }
    });

    if (!bankAccount) {
      bankAccount = await tx.bankAccount.findFirst({
        where: { status: 'ativa' }
      });
    }

    if (!bankAccount) {
      console.warn('[FINANCE-SYNC] Nenhuma conta bancária ativa encontrada para debitar a despesa');
      return;
    }

    // 2. Atualizar o saldo da conta bancária (currentBalance) - debitar!
    await tx.bankAccount.update({
      where: { id: bankAccount.id },
      data: {
        currentBalance: {
          decrement: amount
        }
      }
    });

    // 3. Buscar ou criar o lançamento no Contas a Pagar (AccountPayable)
    const payable = await tx.accountPayable.findFirst({
      where: {
        expenseId: expense.id,
        status: { in: ['previsto', 'aberto', 'parcial', 'vencido'] }
      }
    });

    if (payable) {
      const newPaidAmount = Number(payable.paidAmount) + amount;
      const totalAmount = Number(payable.totalAmount);
      const newStatus = newPaidAmount >= totalAmount ? 'pago' : 'parcial';

      await tx.accountPayable.update({
        where: { id: payable.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          bankAccountId: bankAccount.id,
          paidDate: expense.paidAt || new Date(),
          paymentMethod: 'PIX', // Método padrão de despesa via sistema
          notes: `${payable.notes || ''}\n[BAIXA AUTOMÁTICA] Pago R$ ${amount.toFixed(2)} via integração.`.trim()
        }
      });
    } else {
      // Criar um novo lançamento de Contas a Pagar já pago para fins de histórico
      await tx.accountPayable.create({
        data: {
          title: expense.description,
          description: `Pagamento automático de despesa. Despesa ID: ${expense.id}`,
          totalAmount: amount,
          paidAmount: amount,
          status: 'pago',
          dueDate: expense.dueDate || expense.expenseDate,
          paidDate: expense.paidAt || new Date(),
          origin: 'DESPESA',
          paymentMethod: 'PIX',
          bankAccountId: bankAccount.id,
          expenseId: expense.id,
          vendorId: expense.vendorId,
          notes: `Gerado automaticamente via conciliação de despesa.`
        }
      });
    }

    // 4. Criar registro de conciliação bancária
    await tx.bankReconciliation.create({
      data: {
        bankAccountId: bankAccount.id,
        transactionDate: expense.paidAt || new Date(),
        description: `Pagamento - ${expense.description || 'Despesa'}`,
        amount: amount,
        type: 'SAIDA',
        isReconciled: true,
        reconciledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error syncing expense paid:', error);
  }
}
