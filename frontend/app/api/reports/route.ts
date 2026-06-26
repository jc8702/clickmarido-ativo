import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return false;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const exportParam = searchParams.get('export');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Ajustar fim do dia para incluir tudo
    if (endDateParam && !endDateParam.includes('T')) {
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Obter configurações para a taxa de comissão padrão
    const settings = await prisma.companySettings.findFirst() || { defaultCommissionRate: 40.0 };
    const commissionPercent = Number(settings.defaultCommissionRate) / 100;

    // 2. Buscar pagamentos confirmados no período (Entradas)
    const payments = await prisma.payment.findMany({
      where: {
        status: 'confirmado',
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { customer: true }
    });

    // 3. Buscar despesas pagas no período (Saídas)
    const expenses = await prisma.expense.findMany({
      where: {
        status: 'pago',
        expenseDate: { gte: startDate, lte: endDate }
      }
    });

    // Se o pedido for de exportar em CSV
    if (exportParam === 'csv') {
      const csvRows = [];
      csvRows.push('Data,Tipo,Descricao,Valor,Status');

      // Agrupar entradas
      payments.forEach(p => {
        const dateStr = p.createdAt.toISOString().slice(0, 10);
        const desc = `Recebimento - ${p.customer?.name || 'Cliente avulso'}`.replace(/,/g, ' ');
        csvRows.push(`${dateStr},Entrada,${desc},${p.amount},Confirmado`);
      });

      // Agrupar saídas
      expenses.forEach(e => {
        const dateStr = e.expenseDate.toISOString().slice(0, 10);
        const desc = e.description.replace(/,/g, ' ');
        csvRows.push(`${dateStr},Saida,${desc},${e.amount},Pago`);
      });

      // Ordenar por data
      const header = csvRows[0];
      const sortedRows = csvRows.slice(1).sort((a, b) => a.localeCompare(b));
      const csvContent = [header, ...sortedRows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="relatorio-financeiro.csv"'
        }
      });
    }

    // 4. Calcular consolidados
    const totalInflow = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalOutflow = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 5. Custos de Materiais (Consumo de peças nas OS fechadas no período)
    const productUsages = await prisma.productUsage.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { product: true }
    });
    const materialsCost = productUsages.reduce((acc, curr) => acc + (Number(curr.quantityUsed) * Number(curr.product?.price || 0)), 0);

    // 6. Produtividade e Comissão por Técnico
    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        status: 'concluida',
        completedAt: { gte: startDate, lte: endDate }
      },
      include: { technician: true, productUsages: { include: { product: true } } }
    });

    const technicianPerformanceMap: Record<string, { id: string; name: string; osCount: number; revenue: number; commission: number }> = {};
    
    completedOrders.forEach(so => {
      if (!so.technicianId) return;
      const techId = so.technicianId;
      const techName = so.technician?.name || 'Desconhecido';
      const revenue = Number(so.finalTotal);
      const commission = revenue * commissionPercent;

      if (!technicianPerformanceMap[techId]) {
        technicianPerformanceMap[techId] = {
          id: techId,
          name: techName,
          osCount: 0,
          revenue: 0,
          commission: 0
        };
      }

      technicianPerformanceMap[techId].osCount += 1;
      technicianPerformanceMap[techId].revenue += revenue;
      technicianPerformanceMap[techId].commission += commission;
    });

    const technicianPerformance = Object.values(technicianPerformanceMap);

    // 7. Margens e Lucro Operacional Detalhado por OS
    const osMargins = completedOrders.map(so => {
      const osMaterialsCost = so.productUsages.reduce((acc, curr) => acc + (Number(curr.quantityUsed) * Number(curr.product?.price || 0)), 0);
      const osFinalTotal = Number(so.finalTotal);
      const osCommission = osFinalTotal * commissionPercent;
      const netProfit = osFinalTotal - osMaterialsCost - osCommission;
      const profitMarginPercent = osFinalTotal > 0 ? Math.round((netProfit / osFinalTotal) * 100) : 0;

      return {
        id: so.id,
        number: so.number,
        client: so.customerId,
        total: so.finalTotal,
        materialsCost: osMaterialsCost,
        commission: osCommission,
        netProfit,
        profitMarginPercent
      };
    });

    const netProfitGeneral = totalInflow - totalOutflow;
    const profitMarginGeneral = totalInflow > 0 ? Math.round((netProfitGeneral / totalInflow) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totals: {
          inflow: totalInflow,
          outflow: totalOutflow,
          netProfit: netProfitGeneral,
          profitMarginPercent: profitMarginGeneral,
          materialsCost
        },
        technicianPerformance,
        osMargins,
        transactions: {
          inflows: payments.map(p => ({
            id: p.id,
            date: p.createdAt,
            description: `Faturamento - ${p.customer?.name || 'Cliente'}`,
            amount: p.amount
          })),
          outflows: expenses.map(e => ({
            id: e.id,
            date: e.expenseDate,
            description: e.description,
            category: e.category,
            amount: e.amount
          }))
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
