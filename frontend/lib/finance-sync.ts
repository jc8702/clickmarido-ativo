import { prisma } from './prisma';

export async function logFinancialTransaction(params: {
  type: 'INVOICE_ISSUED' | 'PAYMENT_RECEIVED' | 'EXPENSE_RECORDED' | 'ADJUSTMENT' | 'TRANSFER';
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
