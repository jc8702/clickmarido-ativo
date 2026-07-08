import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    // Buscar contas bancárias ativas
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { status: 'ativa' },
      select: {
        id: true,
        bankName: true,
        nickname: true,
        currentBalance: true,
        accountType: true,
        color: true,
      },
      orderBy: { isDefault: 'desc' },
    });

    const totalBalance = bankAccounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

    // Contas a receber pendentes
    const receivables = await prisma.accountReceivable.aggregate({
      where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    // Contas a receber vencidas
    const overdueReceivables = await prisma.accountReceivable.aggregate({
      where: { status: 'vencido' },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    // Contas a pagar pendentes
    const payables = await prisma.accountPayable.aggregate({
      where: { status: { in: ['aberto', 'parcial', 'vencido'] } },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    // Contas a pagar vencidas
    const overduePayables = await prisma.accountPayable.aggregate({
      where: { status: 'vencido' },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    });

    // Despesas fixas mensais
    const recurringExpenses = await prisma.recurringExpense.aggregate({
      where: { isActive: true },
      _sum: { amount: true },
      _count: true,
    });

    // Fluxo de caixa projetado (próximos 30 dias)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const projectedReceivables = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['aberto', 'parcial'] },
        dueDate: { lte: thirtyDaysFromNow },
      },
      select: { dueDate: true, totalAmount: true, paidAmount: true },
    });

    const projectedPayables = await prisma.accountPayable.findMany({
      where: {
        status: { in: ['aberto', 'parcial'] },
        dueDate: { lte: thirtyDaysFromNow },
      },
      select: { dueDate: true, totalAmount: true, paidAmount: true },
    });

    const projectedInflow = projectedReceivables.reduce(
      (sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0
    );
    const projectedOutflow = projectedPayables.reduce(
      (sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0
    );

    // Últimas movimentações
    const recentReceivables = await prisma.accountReceivable.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        customer: { select: { name: true } },
      },
    });

    const recentPayables = await prisma.accountPayable.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        vendor: { select: { name: true } },
      },
    });

    return NextResponse.json({
      bankAccounts,
      totalBalance,
      receivables: {
        total: receivables._sum.totalAmount || 0,
        paid: receivables._sum.paidAmount || 0,
        pending: (Number(receivables._sum.totalAmount) || 0) - (Number(receivables._sum.paidAmount) || 0),
        count: receivables._count,
      },
      overdueReceivables: {
        total: overdueReceivables._sum.totalAmount || 0,
        paid: overdueReceivables._sum.paidAmount || 0,
        count: overdueReceivables._count,
      },
      payables: {
        total: payables._sum.totalAmount || 0,
        paid: payables._sum.paidAmount || 0,
        pending: (Number(payables._sum.totalAmount) || 0) - (Number(payables._sum.paidAmount) || 0),
        count: payables._count,
      },
      overduePayables: {
        total: overduePayables._sum.totalAmount || 0,
        paid: overduePayables._sum.paidAmount || 0,
        count: overduePayables._count,
      },
      recurringExpenses: {
        total: recurringExpenses._sum.amount || 0,
        count: recurringExpenses._count,
      },
      projection: {
        inflow: projectedInflow,
        outflow: projectedOutflow,
        net: projectedInflow - projectedOutflow,
      },
      recentActivity: {
        receivables: recentReceivables,
        payables: recentPayables,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard financeiro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
