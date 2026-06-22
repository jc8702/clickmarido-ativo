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
    ] = await Promise.all([
      // Total de invoices (valor total)
      prisma.invoice.aggregate({
        where: { status: { not: 'cancelada' } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Invoices pagas
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
    ]);

    // Calcular totais
    const totalReceivable = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPayable = 0; // Implementar quando tiver despesas pendentes

    // Calcular saldo atual (simplificado)
    const currentBalance =
      (paidInvoices._sum.amount || 0) - (recentExpenses.reduce((sum, exp) => sum + exp.amount, 0));

    // Previsão 30/60/90 dias (simplificada)
    const forecast30 = totalReceivable * 0.7;
    const forecast60 = totalReceivable * 0.9;
    const forecast90 = totalReceivable;

    return NextResponse.json({
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
    });
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
