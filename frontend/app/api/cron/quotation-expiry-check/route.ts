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
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar orçamentos com status 'enviado'
    const pendingQuotations = await prisma.quotation.findMany({
      where: {
        status: 'enviado',
      },
      include: {
        customer: true,
      },
    });

    let remindersSent = 0;
    let expiredCount = 0;

    for (const quotation of pendingQuotations) {
      try {
        const quotationDate = quotation.updatedAt || quotation.createdAt;

        // Caso A: Expirado (> 30 dias)
        if (quotationDate < thirtyDaysAgo) {
          await prisma.quotation.update({
            where: { id: quotation.id },
            data: { status: 'cancelado' }, // Ou 'expirado', mantemos 'cancelado' por padrão no CRM para simplificar
          });

          // Logar ação no AuditLog
          await prisma.auditLog.create({
            data: {
              entity: 'quotation',
              entityId: quotation.id,
              action: 'auto_expired_after_30_days',
              newValue: { total: quotation.total },
              createdBy: 'system_cron',
            },
          });

          expiredCount++;
        }
        // Caso B: Enviar lembrete (> 14 dias e lembrete ainda não enviado)
        else if (quotationDate < fourteenDaysAgo && !quotation.expiryNotificationSent) {
          const result = await sendWhatsAppNotification({
            phone: quotation.customer.phone,
            email: quotation.customer.email || undefined,
            template: 'payment_pending', // Lembrete de pendência do orçamento
            variables: {
              customer_name: quotation.customer.name,
              amount: `R$ ${quotation.total.toFixed(2)}`,
            },
          });

          if (result.success) {
            await prisma.quotation.update({
              where: { id: quotation.id },
              data: { expiryNotificationSent: true },
            });

            // Logar ação no AuditLog
            await prisma.auditLog.create({
              data: {
                entity: 'quotation',
                entityId: quotation.id,
                action: 'expiry_reminder_sent',
                newValue: { total: quotation.total },
                createdBy: 'system_cron',
              },
            });

            remindersSent++;
          }
        }
      } catch (error) {
        console.error(`Erro ao processar orçamento ${quotation.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalPending: pendingQuotations.length,
      remindersSent,
      expiredCount,
    });

  } catch (error: any) {
    console.error('Erro no cron job de acompanhamento de orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar orçamentos', details: error.message },
      { status: 500 }
    );
  }
}
