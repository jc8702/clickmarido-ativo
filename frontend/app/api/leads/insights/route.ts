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
        leadsBySource: [],
        funnelDrops: [],
        lossAnalysis: [],
        temperatureStats: [],
        leadsHotAndStale: [],
        slaBreachedLeads: []
      });
    }

    // 2. Leads Qualificados (estágio LEAD_QUALIFICADO ou superior no funil)
    const qualifiedStages = [
      LeadFunnelStage.LEAD_QUALIFICADO,
      LeadFunnelStage.REUNIAO_AGENDADA,
      LeadFunnelStage.COMPARECEU,
      LeadFunnelStage.PROPOSTA_SOLICITADA,
      LeadFunnelStage.PROPOSTA_ENVIADA,
      LeadFunnelStage.EM_NEGOCIACAO,
      LeadFunnelStage.GANHO
    ];

    const qualifiedLeads = leads.filter(l => qualifiedStages.includes(l.funnelStage)).length;

    // 3. Win Rate (Leads GANHO / Total Leads)
    const wonLeads = leads.filter(l => l.funnelStage === LeadFunnelStage.GANHO).length;
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

    // 6. Leads por Origem (Canais)
    const sourceMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      const channel = lead.source?.channel || 'Outros';
      sourceMap[channel] = (sourceMap[channel] || 0) + 1;
    });
    const leadsBySource = Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value
    }));

    // 7. Funil de Vendas (Contagem por Etapa)
    // Definimos a ordem lógica do funil comercial principal para o gráfico
    const stageOrder = [
      { id: LeadFunnelStage.NOVO_LEAD, label: 'Novo Lead' },
      { id: LeadFunnelStage.SEM_CONTATO, label: 'Sem Contato' },
      { id: LeadFunnelStage.EM_CONTATO, label: 'Em Contato' },
      { id: LeadFunnelStage.CONTATO_REALIZADO, label: 'Contato Feito' },
      { id: LeadFunnelStage.LEAD_QUALIFICADO, label: 'Qualificado' },
      { id: LeadFunnelStage.REUNIAO_AGENDADA, label: 'Agendado' },
      { id: LeadFunnelStage.PROPOSTA_SOLICITADA, label: 'Proposta Solicitada' },
      { id: LeadFunnelStage.PROPOSTA_ENVIADA, label: 'Proposta Enviada' },
      { id: LeadFunnelStage.EM_NEGOCIACAO, label: 'Em Negociação' },
      { id: LeadFunnelStage.GANHO, label: 'Ganho (Fechado)' }
    ];

    const funnelDrops = stageOrder.map(stage => {
      const count = leads.filter(l => l.funnelStage === stage.id).length;
      return {
        stage: stage.label,
        count
      };
    });

    // 8. Análise de Perda (Motivos de Descarte)
    const lossMap: { [key: string]: number } = {};
    leads.forEach(lead => {
      if (lead.funnelStage === LeadFunnelStage.PERDIDO || lead.funnelStage === LeadFunnelStage.SEM_RESPOSTA) {
        const reason = lead.lossReason || 'Sem motivo especificado';
        lossMap[reason] = (lossMap[reason] || 0) + 1;
      }
    });
    const lossAnalysis = Object.entries(lossMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // 9. Temperatura do Funil
    const tempMap: { [key: string]: number } = {
      'FRIO': 0,
      'MORNO': 0,
      'QUENTE': 0,
      'PRONTO_ORCAMENTO': 0
    };
    leads.forEach(lead => {
      const statusStr = lead.status.toString();
      tempMap[statusStr] = (tempMap[statusStr] || 0) + 1;
    });
    const temperatureStats = Object.entries(tempMap).map(([name, value]) => ({
      name: name === 'PRONTO_ORCAMENTO' ? 'Pronto Orçamento' : name,
      value
    }));

    // 10. Alertas de Risco: Leads Quentes Inativos (>48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const leadsHotAndStale = leads
      .filter(l => 
        (l.status === LeadStatus.QUENTE || l.status === LeadStatus.PRONTO_ORCAMENTO) && 
        l.funnelStage !== LeadFunnelStage.GANHO && 
        l.funnelStage !== LeadFunnelStage.PERDIDO &&
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

    // 11. Alertas de Risco: Leads com quebra de SLA
    const slaBreachedLeads = leads
      .filter(l => 
        l.slaBreachCount > 0 && 
        l.funnelStage !== LeadFunnelStage.GANHO && 
        l.funnelStage !== LeadFunnelStage.PERDIDO
      )
      .map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        slaBreachCount: l.slaBreachCount,
        funnelStage: l.funnelStage
      }));

    return NextResponse.json({
      totalLeads,
      qualifiedLeads,
      winRate,
      avgResponseTime: avgResponseTimeStr,
      totalRevenue,
      leadsBySource,
      funnelDrops,
      lossAnalysis,
      temperatureStats,
      leadsHotAndStale,
      slaBreachedLeads
    });
  } catch (error) {
    console.error('Error calculating insights:', error);
    return NextResponse.json({ error: 'Erro ao calcular insights' }, { status: 500 });
  }
}
