import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (search) {
      where.phone = { contains: search };
    }

    if (status) {
      where.status = status;
    }

    const messages = await prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.messageLog.count({ where });

    return NextResponse.json({
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[MESSAGES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    // template as typed in whatsapp.ts (e.g. 'payment_reminder', 'service_order_completed')
    const { phone, template, variables } = body;

    if (!phone || !template) {
      return NextResponse.json(
        { error: 'Phone and template are required' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppNotification({
      phone,
      template,
      variables: variables || {},
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 400 }
      );
    }

    // A função sendWhatsAppNotification já grava o MessageLog internamente no banco

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[MESSAGES_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
