import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';

export async function GET(request: NextRequest) {
  // Validate Vercel cron auth
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Find pending payments older than 3 days
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pendente',
        createdAt: { lt: threeDaysAgo },
      },
      include: {
        customer: true,
        quotation: true,
      },
    });

    let sentCount = 0;

    for (const payment of pendingPayments) {
      try {
        // Send reminder
        const result = await sendWhatsAppNotification({
          phone: payment.customer.phone,
          template: 'payment_reminder',
          variables: {
            customer_name: payment.customer.name,
            amount: `R$ ${payment.amount.toFixed(2)}`,
            days_pending: Math.floor(
              (now.getTime() - payment.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            ).toString(),
          },
        });

        if (result.success) {
          // Update reminder tracking
          const reminders = payment.remindersSent || 0;
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              remindersSent: reminders + 1,
              lastReminderAt: new Date(),
            },
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send reminder for payment ${payment.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalPaymentsPending: pendingPayments.length,
      remindersSent: sentCount,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
