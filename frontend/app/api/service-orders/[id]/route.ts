import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';

const JWT_SECRET = process.env.JWT_SECRET;

function decodeToken(request: NextRequest): { userId: string; email: string; role: string } | null {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        quotation: { include: { items: { include: { product: true } } } },
        photos: true,
        signature: true,
        productUsages: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Regra multi-user: Técnico só acessa sua própria OS
    if (user.role === 'technician') {
      const tech = await prisma.technician.findFirst({
        where: { email: user.email, active: true },
        select: { id: true },
      });
      if (!tech || order.technicianId !== tech.id) {
        return NextResponse.json({ error: 'Acesso negado: esta Ordem de Serviço pertence a outro técnico' }, { status: 403 });
      }
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('GET /api/service-orders/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar OS' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Fetch current order to track status change and check access
    const currentOrder = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { technicianId, scheduledTime, address, notes, finalTotal, status, automationLog } = body;

    // Regra multi-user para técnicos no PUT
    if (user.role === 'technician') {
      const tech = await prisma.technician.findFirst({
        where: { email: user.email, active: true },
        select: { id: true },
      });
      if (!tech || currentOrder.technicianId !== tech.id) {
        return NextResponse.json({ error: 'Acesso negado: esta Ordem de Serviço pertence a outro técnico' }, { status: 403 });
      }

      // Bloquear campos administrativos
      if (technicianId !== undefined || scheduledTime !== undefined || address !== undefined || notes !== undefined || finalTotal !== undefined) {
        return NextResponse.json({ error: 'Acesso negado: técnicos podem alterar apenas o status e o checklist' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (scheduledTime !== undefined) updateData.scheduledTime = new Date(scheduledTime);
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (finalTotal !== undefined) updateData.finalTotal = Number(finalTotal);
    if (status !== undefined) updateData.status = status;
    if (automationLog !== undefined) updateData.automationLog = automationLog;

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true, quotation: true },
    });

    // TRIGGER: Automação se técnico foi atribuído ou alterado
    if (technicianId !== undefined && technicianId !== currentOrder.technicianId && order.technician) {
      if (order.technician.phone) {
        try {
          const scheduledTimeStr = order.scheduledTime 
            ? new Date(order.scheduledTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) 
            : 'A agendar';

          await sendWhatsAppNotification({
            phone: order.technician.phone,
            template: 'service_order_created',
            variables: {
              technician_name: order.technician.name,
              customer_name: order.customer.name,
              address: order.address || 'Não informado',
              scheduled_time: scheduledTimeStr,
            },
          });

          await prisma.auditLog.create({
            data: {
              entity: 'service_order',
              entityId: order.id,
              action: 'technician_assigned_notification_sent',
              newValue: { technicianName: order.technician.name },
              createdBy: 'system_automation',
            },
          });
          
          console.log(`[AUTOMATION] Notificação enviada para o técnico: ${order.technician.name}`);
        } catch (error) {
          console.error('[AUTOMATION ERROR] Falha ao notificar o técnico:', error);
        }
      }
    }

    // TRIGGER: Automação se status mudou para 'concluida'
    if (status === 'concluida' && currentOrder.status !== 'concluida') {
      try {
        const { handleServiceOrderCompleted } = await import('@/app/api/automations/service-order-completed');
        const result = await handleServiceOrderCompleted(id);
        console.log('[AUTOMATION TRIGGER] Service order completed:', result);
      } catch (error) {
        console.error('[AUTOMATION ERROR] Failed to trigger service order automation:', error);
        // Continue (não falhar a requisição)
      }
    }
    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'service_order',
      entityId: id,
      action: 'updated',
      oldValue: {
        id: currentOrder.id,
        number: currentOrder.number,
        quotationId: currentOrder.quotationId,
        customerId: currentOrder.customerId,
        technicianId: currentOrder.technicianId,
        status: currentOrder.status,
        finalTotal: currentOrder.finalTotal,
      },
      newValue: {
        id: order.id,
        number: order.number,
        quotationId: order.quotationId,
        customerId: order.customerId,
        technicianId: order.technicianId,
        status: order.status,
        finalTotal: order.finalTotal,
      },
    });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('PUT /api/service-orders/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar OS' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { id } = await params;
  try {
    const user = decodeToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas admins e managers podem excluir OS
    if (user.role === 'technician') {
      return NextResponse.json({ error: 'Acesso negado: apenas administradores podem excluir Ordens de Serviço' }, { status: 403 });
    }

    const oldValue = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    await prisma.serviceOrder.delete({ where: { id } });

    // Registrar log de auditoria
    const { logAudit } = await import('@/lib/audit');
    await logAudit({
      request,
      entity: 'service_order',
      entityId: id,
      action: 'deleted',
      oldValue: oldValue ? {
        id: oldValue.id,
        number: oldValue.number,
        quotationId: oldValue.quotationId,
        customerId: oldValue.customerId,
        technicianId: oldValue.technicianId,
        status: oldValue.status,
        finalTotal: oldValue.finalTotal,
      } : null,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/service-orders/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao deletar ordem de serviço' }, { status: 500 });
  }
}
