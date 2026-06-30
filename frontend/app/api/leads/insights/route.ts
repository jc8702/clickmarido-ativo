import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadFunnelStage, LeadStatus } from '@prisma/client';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = validateToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  try {
    // 1. Buscar todos os leads com origens e responsáveis
    const leads = await prisma.lead.findMany({
      include: {
        source: true,
        responsavel: true,
      }
    });

    const totalLeads = leads.length;

    if (totalLeads === 0) {
      return NextResponse.json({
        totalLeads: 0,
        qualifiedLeads: 0,
        winRate: 0,
        avgResponseTime: '0 min',
        totalRevenue: 0,
        leadsForwardedToQuotation: 0,
        forwardingRate: 0,
        leadsBySource: [],
        leadsByPriority: [],
        funnelDrops: [],
        lossAnalysis: [],
        temperatureStats: [],
        leadsHotAndStale: [],
        slaBreachedLeads: [],
        efficiencyBySource: [],
        efficiencyByCampaign: [],
        efficiencyByMethodology: [],
        followUpPending: [],
        avgTimeInStage: {},
        disqualifiedLeads: 0,
        disqualifiedRate: 0,
      });
    }

    // 2. Leads Qualificados
    const qualifiedStages: LeadFunnelStage[] = [
      LeadFunnelStage.QUALIFICADO,
      LeadFunnelStage.EM_FOLLOWUP,
      LeadFunnelStage.AGENDADO,
      LeadFunnelStage.ENCAMINHADO_ORCAMENTO
    ];

    const qualifiedLeads = leads.filter(l => qualifiedStages.includes(l.funnelStage)).length;

    // 3. Win Rate (Leads ENCAMINHADO_ORCAMENTO / Total Leads)
    const wonLeads = leads.filter(l => l.funnelStage === LeadFunnelStage.ENCAMINHADO_ORCAMENTO).length;
    const winRate = Math.round((wonLeads / totalLeads) * 100);

    // 4. SLA / Tempo de Resposta Médio
    const respondedLeads = leads.filter(l => l.firstResponseTime !== null);
    let avgResponseTimeStr = '0 min';
    if (respondedLeads.length > 0) {
      const totalMinutes = respondedLeads.reduce((acc, lead) => {
        const start = new Date(lead.createdAt).getTime();
        const end = new Date(lead.firstResponseTime!).getTime();
        return acc + Math.max(0, (end - start) / (1000 * 60));
      }, 0);
      const avgMinutes = Math.round(totalMinutes / respondedLeads.length);
      if (avgMinutes > 60) {
        const hours = Math.floor(avgMinutes / 60);
        const mins = avgMinutes % 60;
        avgResponseTimeStr = `${hours}h ${mins}m`;
      } else {
        avgResponseTimeStr = `${avgMinutes} min`;
      }
    }

    // 5. Receita prevista (Soma do valor de orçamentos vinculados a leads em negociação/ativos)
    const quotationIds = leads.map(l => l.quotationId).filter(Boolean) as string[];
    let totalRevenue = 0;
    if (quotationIds.length > 0) {
      const quotations = await prisma.quotation.findMany({
        where: {
          id: { in: quotationIds },
          status: { notIn: ['perdido', 'cancelado', 'rejeitado'] }
        },
        select: { total: true }
      });
      totalRevenue = quotations.reduce((acc, q) => acc + Number(q.total), 0);
    }

    // 6. Taxa de Encaminhamento para Orçamento
    const leadsForwardedToQuotation = leads.filter(l => l.quotationId !== null).length;
    const forwardingRate = Math.round((leadsForwardedToQuotation / totalLeads) * 100);

    // 7. Leads Desqualificados
    const disqualifiedLeads = leads.filter(l => l.funnelStage === LeadFunnelStage.DESCARTADO).length;
    const disqualifiedRate = Math.round((disqualifiedLeads / totalLeads) * 100);

    // 8. Leads por Origem (Canais)
    const sourceMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      const channel = lead.source?.channel || 'Outros';
      sourceMap[channel] = (sourceMap[channel] || 0) + 1;
    });
    const leadsBySource = Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value
    }));

    // 9. Leads por Prioridade
    const priorityMap: { [key: string]: number } = {
      'URGENTE': 0,
      'ALTA': 0,
      'MEDIA': 0,
      'BAIXA': 0,
    };
    leads.forEach(lead => {
      const priority = lead.priority || 'MEDIA';
      priorityMap[priority] = (priorityMap[priority] || 0) + 1;
    });
    const leadsByPriority = Object.entries(priorityMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => {
        const order = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    // 10. Funil de Vendas (Contagem por Etapa)
    const stageOrder = [
      { id: LeadFunnelStage.NOVO_LEAD, label: 'Novo Lead' },
      { id: LeadFunnelStage.EM_TRIAGEM, label: 'Em Triagem' },
      { id: LeadFunnelStage.QUALIFICADO, label: 'Qualificado' },
      { id: LeadFunnelStage.EM_FOLLOWUP, label: 'Em Follow-up' },
      { id: LeadFunnelStage.AGENDADO, label: 'Agendado' },
      { id: LeadFunnelStage.ENCAMINHADO_ORCAMENTO, label: 'Encaminhado Orçamento' }
    ];

    const funnelDrops = stageOrder.map(stage => {
      const count = leads.filter(l => l.funnelStage === stage.id).length;
      return {
        stage: stage.label,
        count
      };
    });

    // 11. Análise de Perda (Motivos de Descarte)
    const lossReasonLabels: { [key: string]: string } = {
      'SEM_ORCAMENTO': 'Sem orçamento',
      'SEM_TIMING': 'Sem timing',
      'SEM_NECESSIDADE': 'Sem necessidade',
      'SEM_AUTORIDADE': 'Sem autoridade',
      'FORA_DE_PERFIL': 'Fora de perfil',
      'CONCORRENCIA': 'Concorrência',
      'RETORNO_FUTURO': 'Retorno futuro',
      'CONTATO_INVALIDO': 'Contato inválido',
    };
    const lossMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      if (lead.funnelStage === LeadFunnelStage.DESCARTADO) {
        const reason = lead.lossReason || 'NAO_INFORMADO';
        const label = lossReasonLabels[reason] || reason;
        lossMap[label] = (lossMap[label] || 0) + 1;
      }
    });
    const lossAnalysis = Object.entries(lossMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // 12. Temperatura do Funil
    const tempMap: { [key: string]: number } = {
      'FRIO': 0,
      'MORNO': 0,
      'QUENTE': 0,
      'URGENTE': 0
    };
    leads.forEach(lead => {
      const statusStr = lead.status.toString();
      tempMap[statusStr] = (tempMap[statusStr] || 0) + 1;
    });
    const temperatureStats = Object.entries(tempMap).map(([name, value]) => ({
      name,
      value
    }));

    // 13. Alertas de Risco: Leads Quentes Inativos (>48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const leadsHotAndStale = leads
      .filter(l => 
        (l.status === LeadStatus.QUENTE || l.status === LeadStatus.URGENTE) && 
        l.funnelStage !== LeadFunnelStage.ENCAMINHADO_ORCAMENTO && 
        l.funnelStage !== LeadFunnelStage.DESCARTADO &&
        new Date(l.updatedAt) < fortyEightHoursAgo
      )
      .map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        status: l.status,
        funnelStage: l.funnelStage,
        lastUpdate: l.updatedAt
      }));

    // 14. Alertas de Risco: Leads com quebra de SLA
    const slaBreachedLeads = leads
      .filter(l => 
        l.slaBreachCount > 0 && 
        l.funnelStage !== LeadFunnelStage.ENCAMINHADO_ORCAMENTO && 
        l.funnelStage !== LeadFunnelStage.DESCARTADO
      )
      .map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        slaBreachCount: l.slaBreachCount,
        funnelStage: l.funnelStage
      }));

    // 15. Eficiência por Canal de Origem
    const channelWonMap: { [key: string]: { total: number; won: number } } = {};
    leads.forEach(lead => {
      const channel = lead.source?.channel || 'Outros';
      if (!channelWonMap[channel]) {
        channelWonMap[channel] = { total: 0, won: 0 };
      }
      channelWonMap[channel].total += 1;
      if (lead.funnelStage === LeadFunnelStage.ENCAMINHADO_ORCAMENTO) {
        channelWonMap[channel].won += 1;
      }
    });

    const efficiencyBySource = Object.entries(channelWonMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      won: stats.won,
      rate: Math.round((stats.won / stats.total) * 100)
    })).sort((a, b) => b.rate - a.rate);

    // 16. Eficiência por Campanha de Vendas
    const campaignWonMap: { [key: string]: { total: number; won: number } } = {};
    leads.forEach(lead => {
      const campaign = lead.source?.campaign || 'Orgânico';
      if (!campaignWonMap[campaign]) {
        campaignWonMap[campaign] = { total: 0, won: 0 };
      }
      campaignWonMap[campaign].total += 1;
      if (lead.funnelStage === LeadFunnelStage.ENCAMINHADO_ORCAMENTO) {
        campaignWonMap[campaign].won += 1;
      }
    });

    const efficiencyByCampaign = Object.entries(campaignWonMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      won: stats.won,
      rate: Math.round((stats.won / stats.total) * 100)
    })).sort((a, b) => b.rate - a.rate);

    // 17. Eficiência por Metodologia de Qualificação
    const methodWonMap: { [key: string]: { total: number; won: number } } = {};
    leads.forEach(lead => {
      const qualData = lead.qualificationData as any;
      const method = qualData?.methodology || 'Não definida';
      if (!methodWonMap[method]) {
        methodWonMap[method] = { total: 0, won: 0 };
      }
      methodWonMap[method].total += 1;
      if (lead.funnelStage === LeadFunnelStage.ENCAMINHADO_ORCAMENTO) {
        methodWonMap[method].won += 1;
      }
    });

    const efficiencyByMethodology = Object.entries(methodWonMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      won: stats.won,
      rate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0
    })).sort((a, b) => b.rate - a.rate);

    // 18. Leads com follow-up pendente (nextFollowupAt no passado)
    const now = new Date();
    const followUpPending = leads
      .filter(l => 
        l.nextFollowupAt && 
        new Date(l.nextFollowupAt) < now &&
        l.funnelStage !== LeadFunnelStage.ENCAMINHADO_ORCAMENTO && 
        l.funnelStage !== LeadFunnelStage.DESCARTADO
      )
      .map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        nextFollowupAt: l.nextFollowupAt,
        funnelStage: l.funnelStage,
        priority: l.priority,
      }))
      .sort((a, b) => new Date(a.nextFollowupAt!).getTime() - new Date(b.nextFollowupAt!).getTime());

    // 19. Tempo médio em cada etapa (estimativa baseada em eventos de stage)
    const stageEvents = await prisma.leadEvent.findMany({
      where: {
        type: 'STAGE_CHANGED',
      },
      orderBy: { createdAt: 'asc' },
    });

    const timeInStage: { [key: string]: number } = {};
    const stageCounts: { [key: string]: number } = {};

    // Agrupar eventos por lead
    const eventsByLead: { [leadId: string]: typeof stageEvents } = {};
    stageEvents.forEach(event => {
      if (!eventsByLead[event.leadId]) {
        eventsByLead[event.leadId] = [];
      }
      eventsByLead[event.leadId].push(event);
    });

    // Calcular tempo entre transições
    Object.values(eventsByLead).forEach(leadEvents => {
      for (let i = 0; i < leadEvents.length - 1; i++) {
        const fromStage = leadEvents[i].newValue?.toString() || 'UNKNOWN';
        const timeDiff = new Date(leadEvents[i + 1].createdAt).getTime() - new Date(leadEvents[i].createdAt).getTime();
        const hours = timeDiff / (1000 * 60 * 60);
        
        if (!timeInStage[fromStage]) {
          timeInStage[fromStage] = 0;
          stageCounts[fromStage] = 0;
        }
        timeInStage[fromStage] += hours;
        stageCounts[fromStage] += 1;
      }
    });

    const avgTimeInStage: { [key: string]: string } = {};
    Object.keys(timeInStage).forEach(stage => {
      const avg = timeInStage[stage] / (stageCounts[stage] || 1);
      if (avg > 24) {
        avgTimeInStage[stage] = `${Math.round(avg / 24)}d`;
      } else {
        avgTimeInStage[stage] = `${Math.round(avg)}h`;
      }
    });

    return NextResponse.json({
      totalLeads,
      qualifiedLeads,
      winRate,
      avgResponseTime: avgResponseTimeStr,
      totalRevenue,
      leadsForwardedToQuotation,
      forwardingRate,
      leadsBySource,
      leadsByPriority,
      funnelDrops,
      lossAnalysis,
      temperatureStats,
      leadsHotAndStale,
      slaBreachedLeads,
      efficiencyBySource,
      efficiencyByCampaign,
      efficiencyByMethodology,
      followUpPending,
      avgTimeInStage,
      disqualifiedLeads,
      disqualifiedRate,
    });
  } catch (error) {
    console.error('Error calculating insights:', error);
    return NextResponse.json({ error: 'Erro ao calcular insights' }, { status: 500 });
  }
}

