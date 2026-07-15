import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { logFinancialTransaction } from '@/lib/finance-sync';

// GET /api/expenses - Listar despesas
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const costCenter = searchParams.get('costCenter') || '';
    const serviceOrderId = searchParams.get('serviceOrderId') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (costCenter) where.costCenter = costCenter;
    if (serviceOrderId) where.serviceOrderId = serviceOrderId;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          serviceOrder: { select: { id: true, number: true } },
          purchaseOrders: {
            include: {
              items: {
                include: {
                  product: { select: { sku: true, name: true } }
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      data: expenses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json({ error: 'Erro ao listar despesas' }, { status: 500 });
  }
}

// POST /api/expenses - Criar despesa
export async function POST(request: NextRequest) {
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
      documentType,
      documentNumber,
      serviceOrderId,
      notes,
    } = body;

    const missingFields: string[] = [];
    if (!category) missingFields.push('categoria');
    if (!description) missingFields.push('descrição');
    if (amount === undefined || amount === '') missingFields.push('valor');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

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
    if (numericAmount > 999999999.99) {
      return NextResponse.json({ error: 'O valor excede o limite permitido' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        costCenter: costCenter || 'OUTROS',
        description,
        amount: numericAmount,
        vendorId: vendorId || null,
        vendorName: vendorName || '',
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        documentType: documentType || null,
        documentNumber: documentNumber || null,
        serviceOrderId: serviceOrderId || null,
        notes: notes || '',
        status: 'pendente',
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    });

    // Integração automática: criar Conta a Pagar vinculada
    try {
      await prisma.accountPayable.create({
        data: {
          title: description,
          description: `Despesa ID: ${expense.id}`,
          totalAmount: numericAmount,
          paidAmount: 0,
          status: 'aberto',
          dueDate: dueDate ? new Date(dueDate) : (expenseDate ? new Date(expenseDate) : new Date()),
          origin: 'DESPESA',
          expenseId: expense.id,
          vendorId: vendorId || null,
          notes: `Gerado automaticamente na criação da despesa.`
        }
      });
    } catch (apError) {
      console.error('[EXPENSES] Erro ao criar conta a pagar vinculada:', apError);
    }

    await logFinancialTransaction({
      type: 'EXPENSE_RECORDED',
      expenseId: expense.id,
      debit: Number(expense.amount),
      description: `Despesa registrada: ${expense.description}`,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 });
  }
}

