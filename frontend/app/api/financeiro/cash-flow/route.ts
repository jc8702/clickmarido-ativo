import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, projected
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const bankAccountId = searchParams.get('bankAccountId');

    // Data inicial padrão: primeiro dia do mês atual
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Buscar contas bancárias
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { status: 'ativa' },
      select: { id: true, bankName: true, nickname: true, currentBalance: true },
    });

    const totalBalance = bankAccounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

    // Buscar entradas (contas a receber)
    const receivables = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['aberto', 'parcial', 'vencido'] },
        dueDate: { gte: start, lte: end },
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Buscar saídas (contas a pagar)
    const payables = await prisma.accountPayable.findMany({
      where: {
        status: { in: ['aberto', 'parcial', 'vencido'] },
        dueDate: { gte: start, lte: end },
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        vendor: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calcular totais
    const totalReceivable = receivables.reduce((sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0);
    const totalPayable = payables.reduce((sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0);

    // Projeção futura (próximos 90 dias)
    const futureEnd = new Date();
    futureEnd.setDate(futureEnd.getDate() + 90);

    const futureReceivables = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['previsto', 'aberto'] },
        dueDate: { gt: end, lte: futureEnd },
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      select: {
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    const futurePayables = await prisma.accountPayable.findMany({
      where: {
        status: { in: ['previsto', 'aberto'] },
        dueDate: { gt: end, lte: futureEnd },
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      select: {
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Projeção 30/60/90 dias
    const projection30 = calculateProjection(futureReceivables, futurePayables, 30);
    const projection60 = calculateProjection(futureReceivables, futurePayables, 60);
    const projection90 = calculateProjection(futureReceivables, futurePayables, 90);

    // Alertas
    const overdueReceivable = receivables.filter(r => r.status === 'vencido');
    const overduePayable = payables.filter(p => p.status === 'vencido');

    return NextResponse.json({
      period: { start, end },
      bankAccounts,
      totalBalance,
      current: {
        receivable: totalReceivable,
        payable: totalPayable,
        projected: totalBalance + totalReceivable - totalPayable,
      },
      items: {
        receivables,
        payables,
      },
      projection: {
        days30: totalBalance + projection30,
        days60: totalBalance + projection60,
        days90: totalBalance + projection90,
      },
      alerts: {
        overdueReceivable: {
          count: overdueReceivable.length,
          total: overdueReceivable.reduce((sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0),
        },
        overduePayable: {
          count: overduePayable.length,
          total: overduePayable.reduce((sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar fluxo de caixa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function calculateProjection(receivables: any[], payables: any[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const receivableTotal = receivables
    .filter(r => r.dueDate <= cutoff)
    .reduce((sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0);

  const payableTotal = payables
    .filter(p => p.dueDate <= cutoff)
    .reduce((sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0);

  return receivableTotal - payableTotal;
}
