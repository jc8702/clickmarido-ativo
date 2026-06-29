import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadFunnelStage, LeadStatus } from '@prisma/client';

export async function GET() {
  try {
    // 1. Buscar todos os leads com origens, alertas e responsáveis
    const leads = await prisma.lead.findMany({
      include: {
        source: true,
        alerts: {
          where: { resolved: false }
        }
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
        funnelDrops: [],
        lossAnalysis: [],
        temperatureStats: [],
        leadsHotAndStale: [],
        slaBreachedLeads: [],
        efficiencyBySource: [],
        efficiencyByCampaign: []
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
          status: { notIn: ['perdido', 'cancelado'] }
        },
        select: { total: true }
      });
      totalRevenue = quotations.reduce((acc, q) => acc + Number(q.total), 0);
    }

    // 6. Taxa de Encaminhamento para Orçamento (leads que geraram orçamentos reais)
    const leadsForwardedToQuotation = leads.filter(l => l.quotationId !== null).length;
    const forwardingRate = Math.round((leadsForwardedToQuotation / totalLeads) * 100);

    // 7. Leads por Origem (Canais)
    const sourceMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      const channel = lead.source?.channel || 'Outros';
      sourceMap[channel] = (sourceMap[channel] || 0) + 1;
    });
    const leadsBySource = Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value
    }));

    // 8. Funil de Vendas (Contagem por Etapa)
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

    // 9. Análise de Perda (Motivos de Descarte)
    const lossMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      if (lead.funnelStage === LeadFunnelStage.DESCARTADO) {
        const reason = lead.lossReason || 'Sem motivo especificado';
        lossMap[reason] = (lossMap[reason] || 0) + 1;
      }
    });
    const lossAnalysis = Object.entries(lossMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // 10. Temperatura do Funil
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

    // 11. Alertas de Risco: Leads Quentes Inativos (>48h)
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

    // 12. Alertas de Risco: Leads com quebra de SLA
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

    // 13. Eficiência por Canal de Origem (Conversão Won / Total Leads)
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

    // 14. Eficiência por Campanha de Vendas (Conversão Won / Total Leads)
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

    return NextResponse.json({
      totalLeads,
      qualifiedLeads,
      winRate,
      avgResponseTime: avgResponseTimeStr,
      totalRevenue,
      leadsForwardedToQuotation,
      forwardingRate,
      leadsBySource,
      funnelDrops,
      lossAnalysis,
      temperatureStats,
      leadsHotAndStale,
      slaBreachedLeads,
      efficiencyBySource,
      efficiencyByCampaign
    });
  } catch (error) {
    console.error('Error calculating insights:', error);
    return NextResponse.json({ error: 'Erro ao calcular insights' }, { status: 500 });
  }
}

