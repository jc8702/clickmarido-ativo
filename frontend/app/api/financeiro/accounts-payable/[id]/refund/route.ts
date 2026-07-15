import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/financeiro/accounts-payable/[id]/refund - Estornar pagamento parcial ou total
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const userEmail = (decoded as any).email || 'admin';

    const body = await request.json();
    const { amount, bankAccountId, notes, cancelAccount } = body;

    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: 'Valor de estorno inválido' }, { status: 400 });
    }

    if (!bankAccountId) {
      return NextResponse.json({ error: 'Conta bancária de destino é obrigatória' }, { status: 400 });
    }

    const account = await prisma.accountPayable.findUnique({
      where: { id },
      include: { expense: true }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta a pagar não encontrada' }, { status: 404 });
    }

    if (Number(account.paidAmount) < refundAmount) {
      return NextResponse.json({ error: 'Valor do estorno maior que o valor já pago' }, { status: 400 });
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      // 1. Atualizar saldo da conta bancária (incremento porque o dinheiro volta)
      const bankAccount = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (!bankAccount) {
        throw new Error('Conta bancária não encontrada');
      }

      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: { increment: refundAmount }
        }
      });

      // 2. Registrar transação financeira de retorno (crédito)
      const lastTransaction = await tx.financialTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { balance: true }
      });
      const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
      const newBalance = prevBalance + refundAmount;

      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_REFUND',
          expenseId: account.expenseId,
          credit: refundAmount,
          debit: 0,
          balance: newBalance,
          description: `Estorno de Pagamento: ${account.title}`,
          notes: notes ? `${notes} (Recebido em: ${bankAccount.nickname || bankAccount.bankName})` : `Estorno efetuado (Recebido em: ${bankAccount.nickname || bankAccount.bankName})`,
          transactionDate: new Date(),
          userId: (decoded as any).id,
          userEmail,
        }
      });

      // 3. Atualizar o AccountPayable
      const newPaidAmount = Number(account.paidAmount) - refundAmount;
      let newStatus = account.status;

      if (cancelAccount) {
        newStatus = 'cancelado';
      } else {
        if (newPaidAmount === 0) {
          newStatus = 'aberto';
        } else {
          newStatus = 'parcial';
        }
      }

      const updated = await tx.accountPayable.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          notes: (account.notes || '') + `\n[ESTORNO] R$ ${refundAmount.toFixed(2)} estornado em ${new Date().toLocaleDateString('pt-BR')}.`,
        }
      });

      // 4. Se a conta a pagar vier de uma despesa e for cancelada, cancelar a despesa também.
      if (cancelAccount && account.expenseId) {
        const allPayables = await tx.accountPayable.findMany({ where: { expenseId: account.expenseId } });
        if (allPayables.length === 1) {
          await tx.expense.update({
            where: { id: account.expenseId },
            data: { status: 'cancelada' }
          });
        }
      }

      return updated;
    });

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error('POST /api/financeiro/accounts-payable/[id]/refund error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
