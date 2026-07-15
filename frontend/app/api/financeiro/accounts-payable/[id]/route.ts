import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.accountPayable.findUnique({
      where: { id },
      include: {
        vendor: true,
        bankAccount: true,
        chartOfAccount: true,
        expense: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao buscar conta a pagar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      title, description, totalAmount, dueDate, status,
      paymentMethod, bankAccountId, vendorId, chartOfAccountId,
      costCenter, discount, interest, fine, notes
    } = body;

    const account = await prisma.accountPayable.update({
      where: { id },
      data: {
        title,
        description,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        paymentMethod,
        bankAccountId,
        vendorId,
        chartOfAccountId,
        costCenter,
        discount,
        interest,
        fine,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const account = await prisma.accountPayable.findUnique({
      where: { id },
      select: { id: true, paidAmount: true, status: true, bankAccountId: true, expenseId: true, paidDate: true, dueDate: true, title: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const amountToRevert = Number(account.paidAmount);

      // 1. Reverter saldo da conta bancária
      if (account.bankAccountId && amountToRevert > 0) {
        await tx.bankAccount.update({
          where: { id: account.bankAccountId },
          data: {
            currentBalance: {
              increment: amountToRevert, // Reverte o débito (devolve para a conta)
            },
          },
        });
      }

      // 2. Excluir conciliação bancária relacionada
      await tx.bankReconciliation.deleteMany({
        where: {
          OR: [
            { referenceType: 'ACCOUNT_PAYABLE', referenceId: id },
            {
              bankAccountId: account.bankAccountId || '',
              amount: amountToRevert,
              type: 'SAIDA',
              transactionDate: account.paidDate || account.dueDate,
            },
          ],
        },
      });

      // 3. Excluir transações financeiras relacionadas ao pagamento/despesa
      if (account.expenseId) {
        await tx.financialTransaction.deleteMany({
          where: {
            expenseId: account.expenseId,
          },
        });

        // 4. Excluir despesa vinculada
        await tx.expense.delete({
          where: { id: account.expenseId },
        });
      }

      // Deletar transações financeiras pelo título se necessário
      await tx.financialTransaction.deleteMany({
        where: {
          description: { contains: account.title },
        },
      });

      // 5. Excluir a conta a pagar
      await tx.accountPayable.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta a pagar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
