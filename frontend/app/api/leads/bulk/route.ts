import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { LeadStatus, LeadFunnelStage, LeadEventType } from '@prisma/client';
import { leadBulkSchema, calculateInitialScore } from '@/lib/validations/lead.schema';

const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = validateToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar com Zod
    const parsed = leadBulkSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json({ error: firstIssue.message }, { status: 400 });
    }

    const { leads } = parsed.data;
    const createdLeads = [];
    const errors: { index: number; name: string; error: string }[] = [];

    for (let i = 0; i < leads.length; i++) {
      const leadData = leads[i];
      const trimmedName = leadData.name.trim();
      const trimmedPhone = leadData.phone?.trim() || null;
      const trimmedEmail = leadData.email?.trim() || null;
      const normalizedChannel = leadData.channel.trim();
      const normalizedCampaign = leadData.campaign?.trim() || null;

      // Resolver LeadSource
      let sourceId: string | null = null;
      if (normalizedChannel) {
        let source = await prisma.leadSource.findFirst({
          where: {
            channel: normalizedChannel,
            campaign: normalizedCampaign,
          },
        });

        if (!source) {
          source = await prisma.leadSource.create({
            data: {
              channel: normalizedChannel,
              campaign: normalizedCampaign,
            },
          });
        }
        sourceId = source.id;
      }

      // Calcular score
      const score = calculateInitialScore({
        status: 'MORNO',
        priority: leadData.priority,
        estimatedValue: leadData.estimatedValue,
        intention: leadData.intention,
        hasPhone: !!trimmedPhone,
        hasEmail: !!trimmedEmail,
      });

      try {
        const lead = await prisma.lead.create({
          data: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            sourceId,
            responsavelId: leadData.responsavelId || null,
            status: LeadStatus.MORNO,
            funnelStage: LeadFunnelStage.NOVO_LEAD,
            priority: leadData.priority,
            estimatedValue: leadData.estimatedValue ?? null,
            qualificationStage: 'ainda sem qualificação',
            intention: leadData.intention?.trim() || null,
            score,
          },
        });

        // Registrar evento de criação em lote
        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            type: LeadEventType.LEAD_CREATED,
            newValue: JSON.stringify({
              name: trimmedName,
              phone: trimmedPhone,
              email: trimmedEmail,
              channel: normalizedChannel,
              campaign: normalizedCampaign,
              priority: leadData.priority,
              estimatedValue: leadData.estimatedValue,
              intention: leadData.intention,
              score,
            }),
            userId: decoded.userId,
            notes: `Importado em lote. Origem: ${normalizedChannel}${normalizedCampaign ? ` / ${normalizedCampaign}` : ''} | Score: ${score}/100`,
          },
        });

        createdLeads.push(lead);
      } catch (err) {
        errors.push({
          index: i,
          name: trimmedName,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: createdLeads.length,
      errors: errors.length > 0 ? errors : undefined,
      leads: createdLeads,
    });
  } catch (error) {
    console.error('Error importing leads in bulk:', error);
    return NextResponse.json({ error: 'Erro ao importar leads em lote' }, { status: 500 });
  }
}
