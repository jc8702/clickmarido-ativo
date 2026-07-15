import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
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

    // Buscar entradas (contas a receber) - incluir todos os status relevantes
    const receivables = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['aberto', 'parcial', 'vencido', 'baixado'] },
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

    // Buscar saídas (contas a pagar) - incluir todos os status relevantes
    const payables = await prisma.accountPayable.findMany({
      where: {
        status: { in: ['aberto', 'parcial', 'vencido', 'pago'] },
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

    // Calcular totais - pendentes vs pagos
    const totalReceivablePending = receivables
      .filter(r => ['aberto', 'parcial', 'vencido'].includes(r.status))
      .reduce((sum, r) => sum + (Number(r.totalAmount) - Number(r.paidAmount)), 0);

    const totalReceivablePaid = receivables
      .filter(r => r.status === 'baixado')
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    const totalPayablePending = payables
      .filter(p => ['aberto', 'parcial', 'vencido'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.totalAmount) - Number(p.paidAmount)), 0);

    const totalPayablePaid = payables
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // Projeção futura (próximos 90 dias)
    const futureEnd = new Date();
    futureEnd.setDate(futureEnd.getDate() + 90);

    const futureReceivables = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['previsto', 'aberto', 'parcial'] },
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
        status: { in: ['previsto', 'aberto', 'parcial'] },
        dueDate: { gt: end, lte: futureEnd },
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      select: {
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Projeção 30/60/90 dias (baseada em saldos pendentes)
    const projection30 = calculateProjection(futureReceivables, futurePayables, 30);
    const projection60 = calculateProjection(futureReceivables, futurePayables, 60);
    const projection90 = calculateProjection(futureReceivables, futurePayables, 90);

    // Incluir recorrências ativas na projeção de saída
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: { isActive: true },
      select: { amount: true, frequency: true, nextDue: true, description: true }
    });

    let recurring30 = 0, recurring60 = 0, recurring90 = 0;
    const now30 = new Date(); now30.setDate(now30.getDate() + 30);
    const now60 = new Date(); now60.setDate(now60.getDate() + 60);
    const now90 = new Date(); now90.setDate(now90.getDate() + 90);

    for (const re of recurringExpenses) {
      const amt = Number(re.amount);
      // Estimar quantas vezes a recorrência será cobrada em cada janela
      if (re.frequency === 'MENSAL') {
        recurring30 += amt;
        recurring60 += amt * 2;
        recurring90 += amt * 3;
      } else if (re.frequency === 'SEMANAL') {
        recurring30 += amt * 4;
        recurring60 += amt * 8;
        recurring90 += amt * 13;
      } else if (re.frequency === 'ANUAL') {
        // Verificar se o nextDue cai dentro da janela
        if (new Date(re.nextDue) <= now90) recurring90 += amt;
        if (new Date(re.nextDue) <= now60) recurring60 += amt;
        if (new Date(re.nextDue) <= now30) recurring30 += amt;
      }
    }

    // Alertas
    const overdueReceivable = receivables.filter(r => r.status === 'vencido');
    const overduePayable = payables.filter(p => p.status === 'vencido');

    return NextResponse.json({
      period: { start, end },
      bankAccounts,
      totalBalance,
      current: {
        receivable: totalReceivablePending,
        receivablePaid: totalReceivablePaid,
        payable: totalPayablePending,
        payablePaid: totalPayablePaid,
        netPending: totalReceivablePending - totalPayablePending,
        projected: totalBalance + totalReceivablePending - totalPayablePending,
      },
      items: {
        receivables,
        payables,
      },
      recurringExpenses: {
        count: recurringExpenses.length,
        monthly: recurringExpenses.reduce((s, r) => s + Number(r.amount), 0),
      },
      projection: {
        days30: totalBalance + projection30 - recurring30,
        days60: totalBalance + projection60 - recurring60,
        days90: totalBalance + projection90 - recurring90,
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
