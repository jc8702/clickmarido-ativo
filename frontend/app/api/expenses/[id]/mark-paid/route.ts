import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

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

    if (existingExpense.status === 'paga') {
      return NextResponse.json({ error: 'Despesa já está paga' }, { status: 400 });
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

      await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE_PAID',
          expenseId: id,
          credit: 0,
          debit: existingExpense.amount,
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
