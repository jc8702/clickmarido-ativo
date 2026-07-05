import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/expenses/[id]/mark-paid - Marcar despesa como paga
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    if (existingExpense.status !== 'pendente') {
      return NextResponse.json({ error: 'Só é possível marcar como paga despesas com status pendente' }, { status: 400 });
    }

    const payDate = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: {
          status: 'paga',
          paidAt: payDate,
        },
      });

      // Buscar a última transação anterior do livro caixa para calcular o saldo acumulado (balance)
      const lastTransaction = await tx.financialTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { balance: true },
      });

      const prevBalance = lastTransaction?.balance ? Number(lastTransaction.balance) : 0;
      const newBalance = prevBalance - Number(existingExpense.amount);

      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_PAID',
          expenseId: id,
          credit: 0,
          debit: existingExpense.amount,
          balance: newBalance,
          description: `Pagamento de Despesa: ${existingExpense.description}`,
          notes: `Categoria: ${existingExpense.category}${existingExpense.costCenter ? ` | Centro de Custo: ${existingExpense.costCenter}` : ''}`,
          transactionDate: payDate
        }
      });

      await tx.auditLog.create({
        data: {
          entity: 'expense',
          entityId: id,
          action: 'status_changed',
          oldValue: { status: existingExpense.status },
          newValue: { status: 'paga', paidAt: payDate }
        }
      });

      return expense;
    });

    return NextResponse.json({ message: 'Despesa marcada como paga', expense: result });
  } catch (error) {
    console.error('POST /api/expenses/[id]/mark-paid error:', error);
    return NextResponse.json({ error: 'Erro ao marcar despesa como paga' }, { status: 500 });
  }
}
