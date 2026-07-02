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
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Buscar garantias que vencem nos próximos 30 dias e que ainda não receberam lembrete
    const expiringWarranties = await prisma.warranty.findMany({
      where: {
        expiry_date: {
          gt: now,
          lte: in30Days,
        },
        reminderSent: false,
      },
      include: {
        customer: true,
      },
    });

    let sentCount = 0;

    for (const warranty of expiringWarranties) {
      try {
        const daysToExpiry = Math.ceil(
          (warranty.expiry_date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Disparar notificação via WhatsApp
        const result = await sendWhatsAppNotification({
          phone: warranty.customer.phone,
          email: warranty.customer.email || undefined,
          template: 'warranty_expiring',
          variables: {
            customer_name: warranty.customer.name,
            service_description: warranty.service_description,
            days_to_expiry: daysToExpiry.toString(),
          },
        });

        if (result.success) {
          // Atualizar o status da garantia para evitar reenvio
          await prisma.warranty.update({
            where: { id: warranty.id },
            data: { reminderSent: true },
          });

          // Logar ação no AuditLog
          await prisma.auditLog.create({
            data: {
              entity: 'warranty',
              entityId: warranty.id,
              action: 'expiry_reminder_sent',
              newValue: { daysToExpiry },
              createdBy: 'system_cron',
            },
          });

          sentCount++;
        }
      } catch (error) {
        console.error(`Erro ao processar lembrete para garantia ${warranty.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalExpiring: expiringWarranties.length,
      remindersSent: sentCount,
    });

  } catch (error: any) {
    console.error('Erro no cron job de expiração de garantia:', error);
    return NextResponse.json(
      { error: 'Erro ao processar expiração de garantias', details: error.message },
      { status: 500 }
    );
  }
}
