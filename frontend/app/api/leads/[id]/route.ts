import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { 
  LeadStatus, 
  LeadFunnelStage, 
  LeadEventType,
  LeadPriority,
  LeadQualificationStage,
  LeadIntention,
  LeadNextAction,
  LeadLossReason,
} from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { 
      name, email, phone, status, funnelStage, responsavelId, lossReason, lossNotes,
      priority, estimatedValue, qualificationStage, intention, nextAction, prioritizationMethod, 
      qualificationData, tags,
      // Novos campos
      lastContactAt, nextFollowupAt, cadenceCount, riskAlert, riskAlertLevel,
      bantBudget, bantAuthority, bantNeed, bantTiming,
      champChallenge, champMoney, champPriority,
    } = body;

    // 1. Buscar o lead atual
    const currentLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!currentLead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    const eventsToCreate: any[] = [];

    // Validar e registrar mudança de Nome
    if (name !== undefined && name !== currentLead.name) {
      updateData.name = name.trim();
    }

    // Validar e registrar mudança de Email
    if (email !== undefined && email !== currentLead.email) {
      updateData.email = email?.trim() || null;
    }

    // Validar e registrar mudança de Telefone
    if (phone !== undefined && phone !== currentLead.phone) {
      updateData.phone = phone?.trim() || null;
    }

    // Validar e registrar mudança de Temperatura (Status)
    if (status !== undefined && status !== currentLead.status) {
      updateData.status = status as LeadStatus;
      eventsToCreate.push({
        type: LeadEventType.LEAD_UPDATED,
        oldValue: currentLead.status,
        newValue: status,
        userId: decoded.userId,
        notes: 'Temperatura do lead atualizada.',
      });
    }

    // Validar e registrar mudança de Responsável
    if (responsavelId !== undefined && responsavelId !== currentLead.responsavelId) {
      updateData.responsavelId = responsavelId || null;
      eventsToCreate.push({
        type: LeadEventType.LEAD_OWNER_ASSIGNED,
        oldValue: currentLead.responsavelId || 'Sem responsável',
        newValue: responsavelId || 'Sem responsável',
        userId: decoded.userId,
        notes: 'Responsável atribuído ao lead.',
      });
    }

    // Prioridade
    if (priority !== undefined && priority !== currentLead.priority) {
      updateData.priority = priority as LeadPriority;
      eventsToCreate.push({
        type: LeadEventType.LEAD_UPDATED,
        oldValue: currentLead.priority,
        newValue: priority,
        userId: decoded.userId,
        notes: `Prioridade comercial alterada para ${priority}.`,
      });
    }

    // Valor estimado
    if (estimatedValue !== undefined) {
      const val = estimatedValue ? Number(estimatedValue) : null;
      const oldVal = currentLead.estimatedValue ? Number(currentLead.estimatedValue) : null;
      if (val !== oldVal) {
        updateData.estimatedValue = val;
        eventsToCreate.push({
          type: LeadEventType.LEAD_UPDATED,
          oldValue: oldVal !== null ? oldVal.toString() : 'Sem valor',
          newValue: val !== null ? val.toString() : 'Sem valor',
          userId: decoded.userId,
          notes: 'Valor estimado de negócio atualizado.',
        });
      }
    }

    // Estágio de qualificação
    if (qualificationStage !== undefined && qualificationStage !== currentLead.qualificationStage) {
      updateData.qualificationStage = qualificationStage as LeadQualificationStage;
      eventsToCreate.push({
        type: LeadEventType.LEAD_UPDATED,
        oldValue: currentLead.qualificationStage,
        newValue: qualificationStage,
        userId: decoded.userId,
        notes: `Maturidade de qualificação comercial atualizada para: ${qualificationStage}.`,
      });
    }

    // Intenção
    if (intention !== undefined && intention !== currentLead.intention) {
      updateData.intention = (intention as LeadIntention) || null;
      eventsToCreate.push({
        type: LeadEventType.LEAD_UPDATED,
        oldValue: currentLead.intention || 'Não definida',
        newValue: intention || 'Não definida',
        userId: decoded.userId,
        notes: `Nível de intenção de compra atualizado para: ${intention || 'Não definida'}.`,
      });
    }

    // Próxima ação
    if (nextAction !== undefined && nextAction !== currentLead.nextAction) {
      updateData.nextAction = (nextAction as LeadNextAction) || null;
      eventsToCreate.push({
        type: LeadEventType.LEAD_UPDATED,
        oldValue: currentLead.nextAction || 'Nenhuma',
        newValue: nextAction || 'Nenhuma',
        userId: decoded.userId,
        notes: `Próximo passo comercial definido: ${nextAction || 'Nenhum'}.`,
      });
    }

    // Método de priorização
    if (prioritizationMethod !== undefined && prioritizationMethod !== currentLead.prioritizationMethod) {
      updateData.prioritizationMethod = prioritizationMethod || null;
    }

    // Dados de qualificação
    if (qualificationData !== undefined) {
      updateData.qualificationData = qualificationData || null;
    }

    // Tags
    if (tags !== undefined && tags !== currentLead.tags) {
      updateData.tags = tags || null;
    }

    // Último contato
    if (lastContactAt !== undefined) {
      updateData.lastContactAt = lastContactAt ? new Date(lastContactAt) : null;
    }

    // Próximo follow-up
    if (nextFollowupAt !== undefined) {
      updateData.nextFollowupAt = nextFollowupAt ? new Date(nextFollowupAt) : null;
    }

    // Contagem de cadência
    if (cadenceCount !== undefined) {
      updateData.cadenceCount = cadenceCount;
    }

    // Alerta de risco
    if (riskAlert !== undefined) {
      updateData.riskAlert = riskAlert || null;
    }
    if (riskAlertLevel !== undefined) {
      updateData.riskAlertLevel = riskAlertLevel || null;
    }

    // BANT
    if (bantBudget !== undefined) {
      updateData.bantBudget = bantBudget || null;
    }
    if (bantAuthority !== undefined) {
      updateData.bantAuthority = bantAuthority || null;
    }
    if (bantNeed !== undefined) {
      updateData.bantNeed = bantNeed || null;
    }
    if (bantTiming !== undefined) {
      updateData.bantTiming = bantTiming || null;
    }

    // CHAMP
    if (champChallenge !== undefined) {
      updateData.champChallenge = champChallenge || null;
    }
    if (champMoney !== undefined) {
      updateData.champMoney = champMoney || null;
    }
    if (champPriority !== undefined) {
      updateData.champPriority = champPriority || null;
    }

    // Validar e registrar mudança de Etapa do Funil
    if (funnelStage !== undefined && funnelStage !== currentLead.funnelStage) {
      updateData.funnelStage = funnelStage as LeadFunnelStage;
      
      // Registrar evento de mudança de etapa
      eventsToCreate.push({
        type: LeadEventType.STAGE_CHANGED,
        oldValue: currentLead.funnelStage,
        newValue: funnelStage,
        userId: decoded.userId,
        notes: `Etapa do funil alterada de ${currentLead.funnelStage} para ${funnelStage}.`,
      });

      // Lógicas específicas de etapa
      if (funnelStage === LeadFunnelStage.DESCARTADO) {
        updateData.lossReason = (lossReason as LeadLossReason) || null;
        updateData.lossNotes = lossNotes || null;

        eventsToCreate.push({
          type: LeadEventType.DEAL_LOST,
          oldValue: currentLead.funnelStage,
          newValue: funnelStage,
          userId: decoded.userId,
          notes: `Lead descartado. Motivo: ${lossReason || 'Não informado'}. Obs: ${lossNotes || ''}`,
        });

        eventsToCreate.push({
          type: LeadEventType.LOST_REASON_DEFINED,
          oldValue: null,
          newValue: lossReason || 'Não informado',
          userId: decoded.userId,
          notes: lossNotes || 'Descarte comercial concluído.',
        });
      }
    }

    // 2. Atualizar o Lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        source: true,
        responsavel: true,
      },
    });

    // 3. Gravar todos os eventos acumulados
    if (eventsToCreate.length > 0) {
      await prisma.leadEvent.createMany({
        data: eventsToCreate.map(event => ({
          leadId: leadId,
          type: event.type,
          oldValue: event.oldValue,
          newValue: event.newValue,
          userId: event.userId,
          notes: event.notes,
        })),
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        source: true,
        responsavel: true,
        appointments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 });
  }
}
