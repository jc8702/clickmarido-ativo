import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Dados reais do banco
    const totalLeads = await prisma.lead.count();
    const qualifiedLeads = await prisma.lead.count({
      where: {
        funnelStage: { in: ['QUALIFICADO', 'LEAD_QUALIFICADO', 'EM_NEGOCIACAO', 'PROPOSTA_ENVIADA', 'PROPOSTA_SOLICITADA'] },
      },
    });

    const wonLeads = await prisma.lead.count({
      where: { funnelStage: 'GANHO' },
    });

    const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // Tempo médio de primeira resposta
    const leadsWithResponse = await prisma.lead.findMany({
      where: { firstResponseTime: { not: null } },
      select: { createdAt: true, firstResponseTime: true },
    });

    let avgResponseTime = '—';
    if (leadsWithResponse.length > 0) {
      const avgMs = leadsWithResponse.reduce((sum, l) => {
        return sum + (l.firstResponseTime!.getTime() - l.createdAt.getTime());
      }, 0) / leadsWithResponse.length;
      const avgMin = Math.round(avgMs / 60000);
      avgResponseTime = avgMin < 60 ? `${avgMin} min` : `${Math.round(avgMin / 60)}h`;
    }

    // Leads por fonte
    const leadsBySourceRaw = await prisma.lead.groupBy({
      by: ['sourceId'],
      _count: { id: true },
    });

    const sources = await prisma.leadSource.findMany();
    const sourceMap = new Map(sources.map(s => [s.id, s.channel]));

    const leadsBySource = leadsBySourceRaw
      .map(item => ({
        name: sourceMap.get(item.sourceId || '') || 'Direto',
        value: item._count.id,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Funil de conversão
    const funnelStages = [
      { stage: 'Novo Lead', stages: ['NOVO_LEAD'] },
      { stage: 'Contato', stages: ['EM_CONTATO', 'CONTATO_REALIZADO', 'SEM_CONTATO'] },
      { stage: 'Qualificado', stages: ['QUALIFICADO', 'LEAD_QUALIFICADO'] },
      { stage: 'Proposta', stages: ['PROPOSTA_SOLICITADA', 'PROPOSTA_ENVIADA', 'EM_NEGOCIACAO'] },
      { stage: 'Ganho', stages: ['GANHO'] },
    ];

    const funnelDrops = await Promise.all(
      funnelStages.map(async ({ stage, stages }) => {
        const count = await prisma.lead.count({
          where: { funnelStage: { in: stages as any } },
        });
        return { stage, count };
      })
    );

    return NextResponse.json({
      totalLeads,
      qualifiedLeads,
      winRate,
      avgResponseTime,
      leadsBySource,
      funnelDrops,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar analytics' },
      { status: 500 }
    );
  }
}
