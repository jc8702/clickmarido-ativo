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
    jwt.verify(authHeader.substring(7), JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const finalTotal = body.final_total || body.finalTotal;

    const updateData: any = {
      status: 'concluida',
      completedAt: new Date(),
    };

    if (finalTotal && !isNaN(finalTotal)) {
      updateData.finalTotal = Number(finalTotal);
    }

    const oldValue = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true },
    });

    // TRIGGER: Automação ao concluir OS
    try {
      const { handleServiceOrderCompleted } = await import('@/app/api/automations/service-order-completed');
      const result = await handleServiceOrderCompleted(id);
      console.log('[AUTOMATION TRIGGER] Service order completed:', result);
    } catch (error) {
      console.error('[AUTOMATION ERROR] Failed to trigger service order automation:', error);
    }

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'service_order',
      entityId: id,
      action: 'completed',
      oldValue: oldValue ? {
        id: oldValue.id,
        number: oldValue.number,
        status: oldValue.status,
        finalTotal: oldValue.finalTotal,
      } : null,
      newValue: {
        id: order.id,
        number: order.number,
        status: order.status,
        finalTotal: order.finalTotal,
      },
    });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('PATCH /api/service-orders/[id]/complete error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao concluir OS' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
