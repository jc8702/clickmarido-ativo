import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

async function handleCompleteOS(request: NextRequest, id: string): Promise<Response> {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const finalTotal = body.final_total || body.finalTotal;
    const { signerName, signatureData, notes } = body;

    const updateData: any = {
      status: 'concluida',
      completedAt: new Date(),
    };

    if (finalTotal && !isNaN(finalTotal)) {
      updateData.finalTotal = Number(finalTotal);
    }

    if (notes) {
      updateData.notes = notes;
    }

    const oldValue = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true },
    });

    // Salvar Assinatura do Cliente
    if (signerName && signatureData) {
      await prisma.signatureRequest.deleteMany({
        where: { serviceOrderId: id },
      });

      await prisma.signatureRequest.create({
        data: {
          serviceOrderId: id,
          signatureData,
          signerName,
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    }

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
    console.error('Complete OS error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao concluir OS' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  return handleCompleteOS(request, id);
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  return handleCompleteOS(request, id);
}
