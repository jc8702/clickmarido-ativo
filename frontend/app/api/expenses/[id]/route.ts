import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/expenses/[id] - Buscar despesa por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar despesa' }, { status: 500 });
  }
}

// PUT /api/expenses/[id] - Editar despesa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category,
      costCenter,
      description,
      amount,
      vendorId,
      vendorName,
      expenseDate,
      dueDate,
      paidAt,
      status,
      documentType,
      documentNumber,
      notes,
    } = body;

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    // Bloquear mudança direta de status para 'paga' — usar endpoint mark-paid
    if (status && status !== existingExpense.status) {
      if (status === 'paga') {
        return NextResponse.json(
          { error: 'Para marcar como paga, use o botão "Pagar" na listagem' },
          { status: 400 }
        );
      }
      if (status !== 'cancelada') {
        return NextResponse.json(
          { error: `Transição de "${existingExpense.status}" para "${status}" não é permitida` },
          { status: 400 }
        );
      }
    }

    // Validar se despesa paga pode ser editada
    if (existingExpense.status === 'paga') {
      const allowedFields = ['notes', 'documentNumber'];
      const attemptedFields = Object.keys(body).filter(k => !allowedFields.includes(k) && body[k] !== undefined);
      if (attemptedFields.length > 0) {
        return NextResponse.json(
          { error: `Despesa paga só permite alteração de observações e número do documento` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (category) updateData.category = category;
    if (costCenter !== undefined) updateData.costCenter = costCenter;
    if (description) updateData.description = description;
    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) {
        return NextResponse.json({ error: 'O valor deve ser um número válido' }, { status: 400 });
      }
      if (numericAmount <= 0) {
        return NextResponse.json({ error: 'O valor deve ser maior que zero' }, { status: 400 });
      }
      if (!isFinite(numericAmount)) {
        return NextResponse.json({ error: 'O valor não pode ser infinito' }, { status: 400 });
      }
      updateData.amount = numericAmount;
    }
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (vendorName !== undefined) updateData.vendorName = vendorName;
    if (expenseDate) updateData.expenseDate = new Date(expenseDate);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    // paidAt só deve ser definido pelo endpoint mark-paid
    if (status) updateData.status = status;
    if (documentType !== undefined) updateData.documentType = documentType;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (notes !== undefined) updateData.notes = notes;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        vendor: { select: { id: true, name: true } },
      },
    });

    // Se a despesa foi cancelada, remover qualquer débito fantasma gerado no Livro-Caixa
    if (status === 'cancelada') {
      await prisma.financialTransaction.deleteMany({
        where: { expenseId: id }
      });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('PUT /api/expenses/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar despesa' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Excluir despesa
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verificar se há transações financeiras vinculadas
    const linkedTransactions = await prisma.financialTransaction.findMany({
      where: { expenseId: id },
    });

    if (linkedTransactions.length > 0) {
      return NextResponse.json(
        { error: 'Despesa possui transações financeiras vinculadas. Cancele a despesa ao invés de excluí-la.' },
        { status: 400 }
      );
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // 1. Remover audit logs vinculados
      await tx.auditLog.deleteMany({ where: { entityId: id } });

      // 2. Desvincular das ordens de compra correspondentes
      await tx.purchaseOrder.updateMany({
        where: { expenseId: id },
        data: { expenseId: null },
      });

      // 3. Excluir despesa
      await tx.expense.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 });
  }
}
