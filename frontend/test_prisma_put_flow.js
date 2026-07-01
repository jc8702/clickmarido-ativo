const { PrismaClient, LeadStatus, LeadFunnelStage, LeadEventType } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosePut() {
  console.log('=== Iniciando Diagnóstico de Fluxo PUT ===');
  let lead = null;
  try {
    // 1. Obter um usuário real da tabela para o test
    const user = await prisma.user.findUnique({
      where: { email: 'teste@clickmarido.com.br' }
    });
    
    if (!user) {
      console.error('Usuário teste@clickmarido.com.br não encontrado no banco!');
      process.exit(1);
    }
    console.log(`[OK] Usuário real encontrado: ID ${user.id}`);

    // 2. Criar o lead temporário
    lead = await prisma.lead.create({
      data: {
        name: 'Lead Diagnóstico PUT',
        status: LeadStatus.QUENTE,
        funnelStage: LeadFunnelStage.NOVO_LEAD
      }
    });
    console.log(`[OK] Lead temporário criado: ID ${lead.id}`);

    const leadId = lead.id;
    const funnelStage = 'EM_CONTATO';
    const userId = user.id; // Usuário real!

    // Simular a lógica exata de api/leads/[id]/route.ts
    const currentLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    const updateData = {
      funnelStage: funnelStage
    };

    const eventsToCreate = [{
      type: LeadEventType.STAGE_CHANGED,
      oldValue: currentLead.funnelStage,
      newValue: funnelStage,
      userId: userId,
      notes: `Etapa do funil alterada de ${currentLead.funnelStage} para ${funnelStage}.`,
    }];

    console.log('Executando update no lead...');
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        source: true,
        responsavel: true,
      },
    });
    console.log('[OK] Lead atualizado no Prisma!');

    console.log('Executando createMany nos eventos...');
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
    console.log('[OK] Eventos criados no Prisma com sucesso!');

  } catch (error) {
    console.error('=== Stack de Erro Encontrada no Fluxo do PUT ===');
    console.error(error);
  } finally {
    if (lead) {
      console.log('Limpando lead...');
      try {
        await prisma.lead.delete({ where: { id: lead.id } });
      } catch (err) {}
    }
    await prisma.$disconnect();
  }
}

diagnosePut();
