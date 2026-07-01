import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';

export async function GET(request: NextRequest) {
  // Validar autenticação do Cron do Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Orçamentos enviados hoje
    const quotationsSent = await prisma.quotation.count({
      where: {
        status: 'enviado',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 2. Orçamentos aprovados hoje
    const quotationsApproved = await prisma.quotation.count({
      where: {
        status: 'aceito',
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 3. Ordens de serviço concluídas hoje
    const serviceOrdersCompleted = await prisma.serviceOrder.count({
      where: {
        status: 'concluida',
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 4. Pagamentos recebidos hoje
    const paymentsReceived = await prisma.payment.count({
      where: {
        status: 'confirmado',
        paidAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 5. Total faturado hoje
    const totalRevenueSum = await prisma.payment.aggregate({
      where: {
        status: 'confirmado',
        paidAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenue = totalRevenueSum._sum.amount || 0;

    // Compilar resumo das métricas
    const reportDate = now.toLocaleDateString('pt-BR');
    const metricsSummary = `Orçamentos Enviados: ${quotationsSent} | Aprovados: ${quotationsApproved} | OS Concluídas: ${serviceOrdersCompleted} | Pagos: ${paymentsReceived}`;
    const revenueSummary = `Faturamento total recebido hoje: R$ ${totalRevenue.toFixed(2)}`;

    console.log('[DAILY REPORT]', {
      reportDate,
      metricsSummary,
      revenueSummary,
    });

    // 6. Enviar notificação para o administrador se a variável ADMIN_PHONE estiver configurada
    const adminPhone = process.env.ADMIN_PHONE;
    let notificationSent = false;
    let notificationError = '';

    if (adminPhone) {
      const result = await sendWhatsAppNotification({
        phone: adminPhone,
        template: 'service_order_completed', // Usamos um template geral para entrega de relatório
        variables: {
          title: `Relatório Diário Click Marido - ${reportDate}`,
          summary: metricsSummary,
          revenue: revenueSummary,
        },
      });
      notificationSent = result.success;
      notificationError = result.error || '';
    } else {
      console.warn('[DAILY REPORT] ADMIN_PHONE não configurado nas variáveis de ambiente. Pulando notificação.');
    }

    // 7. Logar o fechamento do dia no AuditLog
    const log = await prisma.auditLog.create({
      data: {
        entity: 'daily_report',
        entityId: reportDate.replace(/\//g, '-'),
        action: 'report_generated',
        newValue: {
          quotationsSent,
          quotationsApproved,
          serviceOrdersCompleted,
          paymentsReceived,
          totalRevenue,
          notificationSent,
          notificationError,
        },
        createdBy: 'system_cron',
      },
    });

    return NextResponse.json({
      success: true,
      reportDate,
      data: {
        quotationsSent,
        quotationsApproved,
        serviceOrdersCompleted,
        paymentsReceived,
        totalRevenue,
      },
      notificationSent,
      logId: log.id,
    });

  } catch (error: any) {
    console.error('Erro no cron job de relatório diário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar relatório diário', details: error.message },
      { status: 500 }
    );
  }
}
