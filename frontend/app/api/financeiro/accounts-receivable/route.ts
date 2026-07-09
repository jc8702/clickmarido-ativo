import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      // Por padrão, excluir cancelados
      where.status = { not: 'cancelado' };
    }
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.accountReceivable.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          bankAccount: { select: { id: true, bankName: true, nickname: true } },
          chartOfAccount: { select: { id: true, code: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accountReceivable.count({ where }),
    ]);

    // Calcular totais - incluir todos os status relevantes
    const totals = await prisma.accountReceivable.aggregate({
      where: { status: { in: ['aberto', 'parcial', 'vencido', 'baixado'] } },
      _sum: { totalAmount: true, paidAmount: true },
    });

    const overdue = await prisma.accountReceivable.aggregate({
      where: { status: 'vencido' },
      _sum: { totalAmount: true, paidAmount: true },
    });

    // Totais por status
    const pendingTotals = await prisma.accountReceivable.aggregate({
      where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
      _sum: { totalAmount: true, paidAmount: true },
    });

    const paidTotals = await prisma.accountReceivable.aggregate({
      where: { status: 'baixado' },
      _sum: { totalAmount: true, paidAmount: true },
    });

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPending: pendingTotals._sum.totalAmount || 0,
        totalPaid: paidTotals._sum.totalAmount || 0,
        totalOverdue: overdue._sum.totalAmount || 0,
        overduePaid: overdue._sum.paidAmount || 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title, description, totalAmount, dueDate, origin,
      paymentMethod, bankAccountId, customerId, invoiceId,
      chartOfAccountId, costCenter, discount, installment,
      installmentOf, notes
    } = body;

    if (!title || !totalAmount || !dueDate) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    const account = await prisma.accountReceivable.create({
      data: {
        title,
        description,
        totalAmount,
        status: 'aberto',
        dueDate: new Date(dueDate),
        origin: origin || 'MANUAL',
        paymentMethod,
        bankAccountId,
        customerId,
        invoiceId,
        chartOfAccountId,
        costCenter,
        discount: discount || 0,
        installment,
        installmentOf,
        notes,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
