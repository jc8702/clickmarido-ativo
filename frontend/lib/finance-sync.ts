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
    await prisma.financialTransaction.create({
      data: {
        type: params.type,
        invoiceId: params.invoiceId,
        paymentId: params.paymentId,
        expenseId: params.expenseId,
        debit: params.debit || 0,
        credit: params.credit || 0,
        balance: 0, // Should be calculated in a real ledger, keeping 0 for now
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
