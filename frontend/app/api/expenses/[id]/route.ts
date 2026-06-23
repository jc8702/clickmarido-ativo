import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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
  } finally {
    await prisma.$disconnect();
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

    const updateData: any = {};
    if (category) updateData.category = category;
    if (costCenter !== undefined) updateData.costCenter = costCenter;
    if (description) updateData.description = description;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (vendorId !== undefined) updateData.vendorId = vendorId;
    if (vendorName !== undefined) updateData.vendorName = vendorName;
    if (expenseDate) updateData.expenseDate = new Date(expenseDate);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('PUT /api/expenses/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar despesa' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

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

    // Executar alterações transacionais
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da despesa para paga
      const expense = await tx.expense.update({
        where: { id },
        data: {
          status: 'paga',
          paidAt: payDate,
        },
      });

      // 2. Criar transação financeira de saída
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

      // 3. Registrar log de auditoria
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
  } finally {
    await prisma.$disconnect();
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

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir despesa' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
