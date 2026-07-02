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
    // 48 horas atrás (para evitar processar ordens de serviço antigas indefinidamente se o cron falhar)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Buscar ordens de serviço concluídas há mais de 24h e menos de 48h
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: {
        status: 'concluida', // ou o status correspondente
        completedAt: {
          gte: fortyEightHoursAgo,
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        customer: true,
        technician: true,
      },
    });

    let sentCount = 0;

    for (const so of serviceOrders) {
      try {
        // Verificar no AuditLog se já enviamos o lembrete de NPS para esta OS
        const alreadySent = await prisma.auditLog.findFirst({
          where: {
            entity: 'serviceOrder',
            entityId: so.id,
            action: 'nps_reminder_sent',
          },
        });

        if (alreadySent) {
          continue;
        }

        // Buscar se já existe alguma NPS respondida para essa OS
        const hasNps = await prisma.nPS.findFirst({
          where: { serviceOrderId: so.id }
        });

        if (hasNps) {
          continue; // Já tem NPS, não precisa enviar pesquisa
        }

        // Se tem telefone válido, envia notificação
        if (so.customer.phone) {
          // Link dinâmico da pesquisa (usando a rota pública /survey/[id])
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clickmarido-ativo-frontend.vercel.app';
          const npsLink = `${appUrl}/survey/${so.customerId}?os=${so.id}${so.technicianId ? `&tech=${so.technicianId}` : ''}`;

          const result = await sendWhatsAppNotification({
            phone: so.customer.phone,
            email: so.customer.email || undefined,
            template: 'service_order_completed', // Reutiliza o template de OS finalizada que pede avaliação
            variables: {
              customerName: so.customer.name,
              number: so.number || 'OS',
              link: npsLink,
            },
          });

          if (result.success) {
            // Logar no AuditLog para registrar que o NPS foi enviado
            await prisma.auditLog.create({
              data: {
                entity: 'serviceOrder',
                entityId: so.id,
                action: 'nps_reminder_sent',
                newValue: { npsLink },
                createdBy: 'system_cron_nps',
              },
            });

            sentCount++;
          }
        }
      } catch (innerError) {
        console.error(`Erro ao enviar lembrete NPS para a OS ${so.id}:`, innerError);
      }
    }

    return NextResponse.json({
      success: true,
      ordersAnalyzed: serviceOrders.length,
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
