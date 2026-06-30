import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';
import { LeadStatus, LeadFunnelStage, LeadEventType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;

    // 1. Carregar o Lead com source e responsavel
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        source: true,
        responsavel: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Se já foi qualificado, retorna os dados existentes
    if (lead.quotationId && lead.customerId) {
      return NextResponse.json({
        success: true,
        alreadyQualified: true,
        customerId: lead.customerId,
        quotationId: lead.quotationId,
        message: 'Lead já foi qualificado anteriormente.',
      });
    }

    // 2. Resolver ou Criar o Customer (Cliente)
    let customer = null;

    // Buscar por telefone
    if (lead.phone) {
      customer = await prisma.customer.findFirst({
        where: { phone: lead.phone.trim() },
      });
    }

    // Se não achou e tem email, buscar por email
    if (!customer && lead.email) {
      customer = await prisma.customer.findUnique({
        where: { email: lead.email.toLowerCase().trim() },
      });
    }

    // Se ainda não existir, cria o novo cliente
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: lead.name,
          phone: lead.phone || 'Não informado',
          email: lead.email || null,
          addresses: '[]',
        },
      });
    }

    // 3. Gerar Número de Orçamento (PRO-DDMMYYYY-XXXX)
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    const prefix = `PRO-${dateStr}-`;

    const lastQuotation = await prisma.quotation.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
    });

    let sequence = 1;
    if (lastQuotation && lastQuotation.number) {
      const lastSeqStr = lastQuotation.number.replace(prefix, '');
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const generatedNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

    // 4. Extrair dados de qualificação do lead
    const qualificationData = lead.qualificationData as any;
    let leadQualification = null;
    if (qualificationData?.methodology) {
      leadQualification = qualificationData.methodology;
    }

    // 5. Executar todas as operações em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar a Quotation (Orçamento) em rascunho com dados do lead
      const quotation = await tx.quotation.create({
        data: {
          number: generatedNumber,
          customerId: customer!.id,
          total: lead.estimatedValue || 0,
          status: 'rascunho',
          temperature: lead.status === 'FRIO' ? 'FRIO' : lead.status === 'MORNO' ? 'MORNO' : 'QUENTE',
          notes: lead.lossNotes ? `Lead qualificado. Notas comerciais: ${lead.lossNotes}` : 'Orçamento gerado automaticamente via qualificação de lead no Pré-Vendas.',
          leadId: lead.id,
          leadSourceChannel: lead.source?.channel || null,
          leadSourceCampaign: lead.source?.campaign || null,
          leadPriority: lead.priority,
          leadScore: lead.score,
          leadIntention: lead.intention || null,
          leadQualification,
          leadResponsavelId: lead.responsavelId || null,
        },
      });

      // Atualizar o Lead
      await tx.lead.update({
        where: { id: leadId },
        data: {
          customerId: customer!.id,
          quotationId: quotation.id,
          status: lead.status === 'FRIO' ? LeadStatus.MORNO : lead.status,
          funnelStage: LeadFunnelStage.ENCAMINHADO_ORCAMENTO,
          qualificationStage: 'QUALIFICADO',
        },
      });

      // Gravar Histórico de Eventos
      await tx.leadEvent.createMany({
        data: [
          {
            leadId,
            type: LeadEventType.LEAD_QUALIFIED,
            newValue: customer!.id,
            userId: decoded.userId,
            notes: `Lead qualificado e convertido em cliente (${customer!.name}).`,
          },
          {
            leadId,
            type: LeadEventType.STAGE_CHANGED,
            oldValue: lead.funnelStage,
            newValue: LeadFunnelStage.ENCAMINHADO_ORCAMENTO,
            userId: decoded.userId,
            notes: 'Lead avançado para a etapa de Encaminhado para Orçamento.',
          },
          {
            leadId,
            type: LeadEventType.PROPOSAL_REQUESTED,
            newValue: quotation.id,
            userId: decoded.userId,
            notes: `Orçamento comercial gerado: número ${generatedNumber}. Origem: ${lead.source?.channel || 'N/A'}${lead.source?.campaign ? ` / ${lead.source.campaign}` : ''}. Score: ${lead.score}/100.`,
          },
        ],
      });

      return { quotationId: quotation.id, quotationNumber: generatedNumber };
    });

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      quotationId: result.quotationId,
      quotationNumber: result.quotationNumber,
      leadOrigin: {
        channel: lead.source?.channel,
        campaign: lead.source?.campaign,
        priority: lead.priority,
        score: lead.score,
        intention: lead.intention,
      },
      message: 'Lead qualificado e encaminhado para Orçamentos com sucesso!',
    });
  } catch (error) {
    console.error('Error qualifying lead:', error);
    return NextResponse.json({ error: 'Erro ao qualificar lead' }, { status: 500 });
  }
}
