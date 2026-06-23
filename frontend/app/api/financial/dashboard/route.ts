import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      todayPayments,
      todayExpenses,
      recentPayments,
      recentExpenses,
      allPaidExpenses,
      pendingExpensesSum,
      expensesByCategory,
      expensesByCostCenter
    ] = await Promise.all([
      // Total de invoices (valor total)
      prisma.invoice.aggregate({
        where: { status: { not: 'cancelada' } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Invoices pagas (pagamentos confirmados)
      prisma.payment.aggregate({
        where: { status: 'confirmado' },
        _sum: { amount: true },
        _count: true,
      }),

      // Invoices pendentes (a receber)
      prisma.invoice.findMany({
        where: {
          status: { in: ['rascunho', 'emitida'] },
          dueDate: { gte: now },
        },
        select: { totalAmount: true, dueDate: true },
      }),

      // Invoices vencidas
      prisma.invoice.findMany({
        where: {
          status: { in: ['rascunho', 'emitida'] },
          dueDate: { lt: now },
        },
        select: { totalAmount: true, dueDate: true },
      }),

      // Pagamentos de hoje
      prisma.payment.aggregate({
        where: {
          status: 'confirmado',
          paidAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Despesas de hoje
      prisma.expense.aggregate({
        where: {
          status: 'paga',
          paidAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
        _count: true,
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

      // Soma de todas as despesas pagas para o saldo real
      prisma.expense.aggregate({
        where: { status: 'paga' },
        _sum: { amount: true }
      }),

      // Soma das despesas pendentes (a pagar)
      prisma.expense.aggregate({
        where: { status: 'pendente' },
        _sum: { amount: true }
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
      })
    ]);

    // Calcular totais
    const totalReceivable = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPayable = pendingExpensesSum._sum.amount || 0;

    // Calcular saldo atual (real consolidado)
    const currentBalance = (paidInvoices._sum.amount || 0) - (allPaidExpenses._sum.amount || 0);

    // Previsão 30/60/90 dias (simplificada)
    const forecast30 = currentBalance + (totalReceivable * 0.7) - totalPayable;
    const forecast60 = currentBalance + (totalReceivable * 0.9) - totalPayable;
    const forecast90 = currentBalance + totalReceivable - totalPayable;

    const response = NextResponse.json({
      balance: {
        current: currentBalance,
        forecast30,
        forecast60,
        forecast90,
      },
      today: {
        inflow: todayPayments._sum.amount || 0,
        outflow: todayExpenses._sum.amount || 0,
      },
      receivable: {
        overdue: totalOverdue,
        pending: totalReceivable - totalOverdue,
        total: totalReceivable,
      },
      payable: {
        overdue: 0,
        pending: totalPayable,
        total: totalPayable,
      },
      counts: {
        totalInvoices: totalInvoices._count,
        paidInvoices: paidInvoices._count,
        pendingPayments: todayPayments._count,
        pendingExpenses: todayExpenses._count,
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
  } finally {
    await prisma.$disconnect();
  }
}
