import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { 
  LeadStatus, 
  LeadFunnelStage, 
  LeadEventType,
  LeadPriority,
  LeadQualificationStage,
  LeadIntention,
  LeadNextAction,
} from '@prisma/client';
import { leadCreateSchema, calculateInitialScore } from '@/lib/validations/lead.schema';

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

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const leads = await prisma.lead.findMany({
      include: {
        source: true,
        responsavel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
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
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json({ error: firstIssue.message }, { status: 400 });
    }

    const data = parsed.data;
    const trimmedName = data.name.trim();
    const trimmedPhone = data.phone?.trim() || null;
    const trimmedEmail = data.email?.trim() || null;
    const normalizedChannel = data.channel.trim();
    const normalizedCampaign = data.campaign?.trim() || null;

    // 1. Resolver o LeadSource
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

    // 2. Calcular score inicial
    const score = calculateInitialScore({
      status: data.status,
      priority: data.priority,
      estimatedValue: data.estimatedValue,
      intention: data.intention || undefined,
      hasPhone: !!trimmedPhone,
      hasEmail: !!trimmedEmail,
      bantBudget: data.bantBudget,
      bantAuthority: data.bantAuthority,
      bantNeed: data.bantNeed,
      bantTiming: data.bantTiming,
    });

    // 3. Determinar método de priorização com base nos dados
    let prioritizationMethod: string | null = null;
    if (data.priority === 'URGENTE') prioritizationMethod = 'oportunidade em risco';
    else if (data.priority === 'ALTA') prioritizationMethod = 'alta prioridade';
    else if (data.status === 'URGENTE') prioritizationMethod = 'oportunidade em risco';
    else if (data.status === 'QUENTE') prioritizationMethod = 'follow-up hoje';

    // 4. Criar o Lead
    const lead = await prisma.lead.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        sourceId,
        responsavelId: data.responsavelId || null,
        status: data.status as LeadStatus,
        funnelStage: LeadFunnelStage.NOVO_LEAD,
        priority: data.priority as LeadPriority,
        estimatedValue: data.estimatedValue ?? null,
        qualificationStage: (data.qualificationStage as LeadQualificationStage) || 'SEM_VALIDACAO',
        intention: (data.intention as LeadIntention) || null,
        nextAction: (data.nextAction as LeadNextAction) || null,
        prioritizationMethod,
        tags: data.tags?.trim() || null,
        score,
        // BANT
        bantBudget: data.bantBudget || null,
        bantAuthority: data.bantAuthority || null,
        bantNeed: data.bantNeed || null,
        bantTiming: data.bantTiming || null,
        // CHAMP
        champChallenge: data.champChallenge || null,
        champMoney: data.champMoney || null,
        champPriority: data.champPriority || null,
      },
      include: {
        source: true,
        responsavel: true,
      },
    });

    // 5. Registrar evento de criação com detalhes completos
    const eventParts = [
      data.notes?.trim() || null,
      `Origem: ${normalizedChannel}${normalizedCampaign ? ` / ${normalizedCampaign}` : ''}`,
      `Temperatura: ${data.status}`,
      `Prioridade: ${data.priority}`,
      `Score: ${score}/100`,
      data.estimatedValue ? `Valor previsto: R$ ${data.estimatedValue}` : null,
      data.intention ? `Intenção: ${data.intention}` : null,
      data.bantBudget ? `BANT Budget: ${data.bantBudget}` : null,
      data.bantAuthority ? `BANT Authority: ${data.bantAuthority}` : null,
    ];
    const eventNotes = eventParts.filter(Boolean).join(' | ');

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
          status: data.status,
          priority: data.priority,
          estimatedValue: data.estimatedValue,
          intention: data.intention,
          score,
          bantBudget: data.bantBudget,
          bantAuthority: data.bantAuthority,
          bantNeed: data.bantNeed,
          bantTiming: data.bantTiming,
        }),
        userId: decoded.userId,
        notes: eventNotes || 'Lead criado manualmente.',
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 });
  }
}

