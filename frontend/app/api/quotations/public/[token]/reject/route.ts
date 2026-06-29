import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadEventType, LeadFunnelStage, LeadStatus } from '@prisma/client';

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { token } = await params;
  
  try {
    const body = await request.json();
    const { reason } = body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: token },
      include: {
        customer: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Atualizar status do orçamento para reprovado
    await prisma.quotation.update({
      where: { id: token },
      data: {
        status: 'reprovado',
        notes: quotation.notes 
          ? `${quotation.notes}\n\nReprovado pelo cliente. Motivo: ${reason || 'Não informado'}`
          : `Reprovado pelo cliente. Motivo: ${reason || 'Não informado'}`,
      },
    });

    // Buscar o lead associado ao orçamento
    const lead = await prisma.lead.findFirst({
      where: { quotationId: token },
    });

    if (lead) {
      // Retornar o lead ao funil
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          funnelStage: LeadFunnelStage.EM_FOLLOWUP,
          status: LeadStatus.MORNO,
          quotationId: null, // Desassocia do orçamento
          qualificationStage: 'DESQUALIFICADO',
          lossReason: 'SEM_ORCAMENTO',
          lossNotes: `Orçamento ${quotation.number} reprovado. Motivo: ${reason || 'Não informado'}`,
        },
      });

      // Registrar evento de desqualificação
      await prisma.leadEvent.create({
        data: {
          leadId: lead.id,
          type: LeadEventType.LEAD_DISQUALIFIED,
          oldValue: lead.funnelStage,
          newValue: LeadFunnelStage.EM_FOLLOWUP,
          notes: `Orçamento ${quotation.number} reprovado pelo cliente. Motivo: ${reason || 'Não informado'}. Lead retornado ao funil para follow-up.`,
        },
      });

      // Registrar mudança de etapa
      await prisma.leadEvent.create({
        data: {
          leadId: lead.id,
          type: LeadEventType.STAGE_CHANGED,
          oldValue: LeadFunnelStage.ENCAMINHADO_ORCAMENTO,
          newValue: LeadFunnelStage.EM_FOLLOWUP,
          notes: 'Lead retornado para follow-up após reprovação do orçamento.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Orçamento reprovado. O lead foi retornado ao funil para follow-up.',
    });

  } catch (error) {
    console.error('POST /api/quotations/public/[token]/reject error:', error);
    return NextResponse.json({ error: 'Erro ao rejeitar orçamento' }, { status: 500 });
  }
}
