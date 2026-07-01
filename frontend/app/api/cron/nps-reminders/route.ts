import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';

export async function GET(request: NextRequest) {
  // Validar autenticação do Cron do Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();
    // 24 horas atrás
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // 48 horas atrás (para evitar processar pagamentos antigos indefinidamente se o cron falhar)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Buscar pagamentos confirmados há mais de 24h e menos de 48h
    const payments = await prisma.payment.findMany({
      where: {
        status: 'confirmado',
        confirmedAt: {
          gte: fortyEightHoursAgo,
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        customer: true,
        quotation: true,
      },
    });

    let sentCount = 0;

    for (const payment of payments) {
      try {
        // Verificar no AuditLog se já enviamos o lembrete de NPS para este pagamento
        const alreadySent = await prisma.auditLog.findFirst({
          where: {
            entity: 'payment',
            entityId: payment.id,
            action: 'nps_reminder_sent',
          },
        });

        if (alreadySent) {
          continue;
        }

        // Buscar se já existe alguma OS correspondente a esse orçamento que já possua Review
        let hasReview = false;
        if (payment.quotationId) {
          const serviceOrders = await prisma.serviceOrder.findMany({
            where: { quotationId: payment.quotationId },
            select: { id: true },
          });

          const osIds = serviceOrders.map(so => so.id);
          if (osIds.length > 0) {
            const review = await prisma.review.findFirst({
              where: { serviceOrderId: { in: osIds } },
            });
            if (review) {
              hasReview = true;
            }
          }
        }

        if (hasReview) {
          continue; // Já tem review, não precisa enviar pesquisa
        }

        // Se tem telefone válido, envia notificação
        if (payment.customer.phone) {
          // Link dinâmico da pesquisa (usando a URL de produção ou localhost)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clickmarido-ativo-frontend.vercel.app';
          const npsLink = `${appUrl}/nps?clientId=${payment.customerId}&paymentId=${payment.id}`;

          // Enviar WhatsApp
          const result = await sendWhatsAppNotification({
            phone: payment.customer.phone,
            template: 'service_order_completed', // Reutiliza o template de OS finalizada que pede avaliação
            variables: {
              customerName: payment.customer.name,
              number: payment.quotation?.number || 'OS',
              link: npsLink,
            },
          });

          if (result.success) {
            // Logar no AuditLog para registrar que o NPS foi enviado
            await prisma.auditLog.create({
              data: {
                entity: 'payment',
                entityId: payment.id,
                action: 'nps_reminder_sent',
                newValue: { npsLink },
                createdBy: 'system_cron_nps',
              },
            });

            sentCount++;
          }
        }
      } catch (innerError) {
        console.error(`Erro ao enviar lembrete NPS para o pagamento ${payment.id}:`, innerError);
      }
    }

    return NextResponse.json({
      success: true,
      paymentsAnalyzed: payments.length,
      remindersSent: sentCount,
    });
  } catch (error: any) {
    console.error('Erro no cron job de lembrete NPS:', error);
    return NextResponse.json(
      { error: 'Erro ao processar lembretes NPS', details: error.message },
      { status: 500 }
    );
  }
}
