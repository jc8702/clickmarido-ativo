const { PrismaClient, LeadStatus, LeadFunnelStage, LeadEventType } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
  console.log('Testando atualização do lead e gravação de eventos isolada...');
  let lead = null;
  try {
    // 1. Criar lead temporário
    lead = await prisma.lead.create({
      data: {
        name: 'Lead Teste Temporário Update',
        status: LeadStatus.QUENTE,
        funnelStage: LeadFunnelStage.NOVO_LEAD
      }
    });
    console.log(`[OK] Lead temporário criado: ID ${lead.id}`);

    const leadId = lead.id;
    const funnelStage = 'EM_CONTATO';
    const userId = null; // de teste

    console.log('Preparando atualização...');
    const updateData = {
      funnelStage: funnelStage
    };

    const eventsToCreate = [{
      type: LeadEventType.STAGE_CHANGED,
      oldValue: lead.funnelStage,
      newValue: funnelStage,
      userId: userId,
      notes: `Etapa do funil alterada de ${lead.funnelStage} para ${funnelStage}.`,
    }];

    // 2. Atualizar lead
    console.log('Executando prisma.lead.update...');
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    });
    console.log(`[OK] Lead atualizado: funnelStage = ${updated.funnelStage}`);

    // 3. Gravar eventos
    console.log('Executando prisma.leadEvent.createMany...');
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
    console.log('[OK] Eventos gravados com createMany!');

  } catch (error) {
    console.error('FALHA ENCONTRADA:');
    console.error(error);
  } finally {
    if (lead) {
      console.log('Limpando lead temporário...');
      try {
        await prisma.lead.delete({ where: { id: lead.id } });
      } catch (err) {}
    }
    await prisma.$disconnect();
  }
}

testUpdate();
