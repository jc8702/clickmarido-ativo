import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronSecret } from '@/lib/auth';

// SLA limite de tempo de primeira resposta (ex: 15 minutos = 15 * 60 * 1000 ms)
const SLA_LIMIT_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoffTime = new Date(Date.now() - SLA_LIMIT_MS);
    
    // Busca leads criados antes do cutoffTime, que ainda não tiveram contato (firstResponseTime = null)
    // e que ainda não atingiram o limite de alertas ou que não possuem alerta aberto
    const overdueLeads = await prisma.lead.findMany({
      where: {
        firstResponseTime: null,
        createdAt: {
          lt: cutoffTime
        },
        alerts: {
          none: {
            type: 'SLA_FIRST_RESPONSE_EXCEEDED',
            resolved: false
          }
        }
      }
    });

    if (overdueLeads.length > 0) {
      await Promise.all(overdueLeads.map(async (lead) => {
        // Criar o alerta operacional de SLA
        await prisma.operationalAlert.create({
          data: {
            leadId: lead.id,
            type: 'SLA_FIRST_RESPONSE_EXCEEDED',
            message: `O tempo de resposta ao lead ${lead.name} excedeu 15 minutos.`
          }
        });

        // Registrar o evento de SLA violado
        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            type: 'SLA_BREACHED',
            notes: 'SLA de primeira resposta excedido.'
          }
        });

        // Atualizar o contador de quebras no lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            slaBreachCount: {
              increment: 1
            }
          }
        });
      }));

      console.log(`[SLA Cron] ${overdueLeads.length} leads marcados com quebra de SLA.`);
    }

    return NextResponse.json({ success: true, processed: overdueLeads.length });
  } catch (error) {
    console.error('Error processing SLA cron:', error);
    return NextResponse.json({ error: 'Erro ao processar SLA' }, { status: 500 });
  }
}
