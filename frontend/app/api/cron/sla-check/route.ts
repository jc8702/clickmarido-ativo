import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadStatus, LeadFunnelStage, LeadEventType } from '@prisma/client';
import { verifyCronSecret } from '@/lib/auth';

// Cron job: Verifica leads estagnados e quebra de SLA
// Pode ser chamado via Vercel Cron ou external scheduler
// GET /api/cron/sla-check

const SLA_THRESHOLDS = {
  URGENTE: 2 * 60 * 60 * 1000,    // 2 horas
  QUENTE: 4 * 60 * 60 * 1000,    // 4 horas
  MORNO: 24 * 60 * 60 * 1000,    // 24 horas
  FRIO: 72 * 60 * 60 * 1000,     // 72 horas
};

const STALE_THRESHOLDS = {
  URGENTE: 2 * 60 * 60 * 1000,    // 2 horas
  QUENTE: 48 * 60 * 60 * 1000,   // 48 horas
};

export async function GET(request: NextRequest) {
  try {
    // Verificar secret para segurança (SEGURO: rejeita se não configurado)
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      slaBreached: 0,
      staleLeads: 0,
      alertsCreated: 0,
    };

    // 1. Buscar leads ativos (não descartados, não encaminhados, não ganhos e não perdidos)
    const activeLeads = await prisma.lead.findMany({
      where: {
        funnelStage: {
          notIn: [LeadFunnelStage.DESCARTADO, LeadFunnelStage.ENCAMINHADO_ORCAMENTO, LeadFunnelStage.GANHO, LeadFunnelStage.PERDIDO],
        },
      },
      include: {
        source: true,
        responsavel: true,
      },
    });

    for (const lead of activeLeads) {
      const lastUpdate = new Date(lead.updatedAt).getTime();
      const timeSinceUpdate = now.getTime() - lastUpdate;
      
      // 2. Verificar quebra de SLA
      const slaThreshold = SLA_THRESHOLDS[lead.status as keyof typeof SLA_THRESHOLDS] || SLA_THRESHOLDS.MORNO;
      
      if (timeSinceUpdate > slaThreshold) {
        // Incrementar contador de quebra de SLA
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            slaBreachCount: lead.slaBreachCount + 1,
            riskAlert: `SLA estourado: sem atualização há ${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h`,
            riskAlertLevel: 'high',
          },
        });

        // Registrar evento
        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            type: LeadEventType.STAGE_CHANGED,
            oldValue: `SLA OK (${lead.slaBreachCount} quebras)`,
            newValue: `SLA Estourado (${lead.slaBreachCount + 1} quebras)`,
            notes: `Lead sem atualização há ${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h. Limite para ${lead.status}: ${Math.round(slaThreshold / (60 * 60 * 1000))}h.`,
          },
        });

        results.slaBreached++;
        results.alertsCreated++;
      }

      // 3. Verificar leads estagnados (hot leads sem contato)
      const staleThreshold = STALE_THRESHOLDS[lead.status as keyof typeof STALE_THRESHOLDS];
      
      if (staleThreshold && timeSinceUpdate > staleThreshold) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            riskAlert: `Lead estagnado: ${lead.status} sem contato há ${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h`,
            riskAlertLevel: lead.status === 'URGENTE' ? 'critical' : 'high',
          },
        });

        results.staleLeads++;
      }
    }

    // 4. Buscar leads com follow-up atrasado
    const overdueFollowups = await prisma.lead.findMany({
      where: {
        nextFollowupAt: {
          lt: now,
        },
        funnelStage: {
          notIn: [LeadFunnelStage.DESCARTADO, LeadFunnelStage.ENCAMINHADO_ORCAMENTO, LeadFunnelStage.GANHO, LeadFunnelStage.PERDIDO],
        },
      },
    });

    for (const lead of overdueFollowups) {
      const followupTime = new Date(lead.nextFollowupAt!).getTime();
      const overdueHours = Math.round((now.getTime() - followupTime) / (60 * 60 * 1000));
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          riskAlert: `Follow-up atrasado há ${overdueHours}h`,
          riskAlertLevel: overdueHours > 24 ? 'critical' : 'medium',
        },
      });

      results.alertsCreated++;
    }

    console.log(`[SLA Cron] Executado em ${now.toISOString()}:`, results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[SLA Cron] Erro:', error);
    return NextResponse.json({ error: 'Erro ao executar cron de SLA' }, { status: 500 });
  }
}
