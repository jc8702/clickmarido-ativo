import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/financial/dashboard - Dashboard financeiro consolidado
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Buscar dados em paralelo
    const [
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      recentPayments,
      recentExpenses,
      pendingExpensesSum,
      overdueExpenses,
      pendingFutureExpenses,
      expensesByCategory,
      expensesByCostCenter,
      // Novas consultas via FinancialTransaction (Ledger)
      ledgerTotals,
      todayLedger
    ] = await Promise.all([
      // Total de invoices (valor total)
      prisma.invoice.aggregate({
        where: { status: { not: 'cancelada' } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Invoices pendentes (a receber) — apenas emitidas, rascunho não é cobrança
      prisma.invoice.findMany({
        where: {
          status: 'emitida',
          dueDate: { gte: now },
        },
        select: { totalAmount: true, dueDate: true },
      }),

      // Invoices vencidas — apenas emitidas
      prisma.invoice.findMany({
        where: {
          status: 'emitida',
          dueDate: { lt: now },
        },
        select: { totalAmount: true, dueDate: true },
      }),

      // Últimos pagamentos
      prisma.payment.findMany({
        where: { status: 'confirmado' },
        orderBy: { paidAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          method: true,
          customer: { select: { name: true } },
        },
      }),

      // Últimas despesas
      prisma.expense.findMany({
        where: { status: 'paga' },
        orderBy: { paidAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          category: true,
          description: true,
        },
      }),

      // Soma das despesas pendentes (a pagar)
      prisma.expense.aggregate({
        where: { status: 'pendente' },
        _sum: { amount: true }
      }),

      // Despesas vencidas (dueDate < hoje e ainda não pagas)
      prisma.expense.findMany({
        where: {
          status: 'pendente',
          dueDate: { lt: now },
        },
        select: { amount: true, dueDate: true },
      }),

      // Despesas pendentes com vencimento futuro (para forecast)
      prisma.expense.findMany({
        where: {
          status: 'pendente',
          dueDate: { gte: now },
        },
        select: { amount: true, dueDate: true },
      }),

      // Agrupamento por categoria de despesas
      prisma.expense.groupBy({
        by: ['category'],
        where: { status: 'paga' },
        _sum: { amount: true }
      }),

      // Agrupamento por centro de custo de despesas
      prisma.expense.groupBy({
        by: ['costCenter'],
        where: { status: 'paga' },
        _sum: { amount: true }
      }),

      // Ledger: Total de Créditos e Débitos na conta
      prisma.financialTransaction.aggregate({
        _sum: { credit: true, debit: true }
      }),

      // Ledger: Movimentação de hoje
      prisma.financialTransaction.aggregate({
        where: {
          transactionDate: { gte: todayStart, lt: todayEnd }
        },
        _sum: { credit: true, debit: true },
        _count: true
      })
    ]);

    // Calcular totais
    const totalReceivable = pendingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPayable = Number(pendingExpensesSum._sum.amount || 0);
    const totalPayableOverdue = overdueExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Garantir que pending não seja negativo (overdue já está incluído no total)
    const receivablePending = Math.max(0, totalReceivable - totalOverdue);
    const payablePending = Math.max(0, totalPayable - totalPayableOverdue);

    // Saldo real: Lê diretamente do Livro-Caixa (FinancialTransaction)
    const currentBalance = Number(ledgerTotals._sum.credit || 0) - Number(ledgerTotals._sum.debit || 0);

    // Saldo projetado: saldo real - despesas pendentes (compromissos a pagar)
    const projectedBalance = currentBalance - totalPayable;

    // Previsão 30/60/90 dias — ponderada por datas de vencimento reais
    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const now90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Receitas previstas: faturas emitidas que vencerão no período
    const forecastableReceivable = pendingInvoices;
    const forecast30Receivable = forecastableReceivable
      .filter(inv => inv.dueDate <= now30)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const forecast60Receivable = forecastableReceivable
      .filter(inv => inv.dueDate <= now60)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const forecast90Receivable = forecastableReceivable
      .filter(inv => inv.dueDate <= now90)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Despesas previstas: despesas pendentes (vencidas + futuras) que vencerão no período
    const allPendingExpenses = [...overdueExpenses, ...pendingFutureExpenses];
    const forecast30Payable = allPendingExpenses
      .filter(exp => exp.dueDate && exp.dueDate <= now30)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const forecast60Payable = allPendingExpenses
      .filter(exp => exp.dueDate && exp.dueDate <= now60)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const forecast90Payable = allPendingExpenses
      .filter(exp => exp.dueDate && exp.dueDate <= now90)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Forecast = saldo atual + receitas previstas - despesas previstas no período
    const forecast30 = currentBalance + forecast30Receivable - forecast30Payable;
    const forecast60 = currentBalance + forecast60Receivable - forecast60Payable;
    const forecast90 = currentBalance + forecast90Receivable - forecast90Payable;

    const response = NextResponse.json({
      balance: {
        current: currentBalance,
        projected: projectedBalance,
        forecast30,
        forecast60,
        forecast90,
      },
      today: {
        inflow: todayLedger._sum.credit || 0,
        outflow: todayLedger._sum.debit || 0,
      },
      receivable: {
        overdue: totalOverdue,
        pending: receivablePending,
        total: totalReceivable,
      },
      payable: {
        overdue: totalPayableOverdue,
        pending: payablePending,
        total: totalPayable,
      },
      counts: {
        totalInvoices: totalInvoices._count,
        confirmedPayments: 0, // Removed to avoid extra queries, or can be fetched if needed
        todayPayments: todayLedger._count,
        todayExpenses: 0, // Replaced by todayLedger count
      },
      recentActivity: {
        payments: recentPayments,
        expenses: recentExpenses,
      },
      distribution: {
        byCategory: expensesByCategory.map(item => ({
          category: item.category,
          amount: item._sum.amount || 0
        })),
        byCostCenter: expensesByCostCenter.map(item => ({
          costCenter: item.costCenter || 'OUTROS',
          amount: item._sum.amount || 0
        }))
      }
    });

    // Desativar cache completamente
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('GET /api/financial/dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dashboard financeiro' },
      { status: 500 }
    );
}
}