const axios = require('axios');

async function runCrmAudit() {
  console.log('=== INICIANDO AUDITORIA DO FLUXO CRM E PRÉ-VENDAS ===\n');
  try {
    const baseUrl = 'http://localhost:3000';
    
    // 1. Login para obter token
    console.log('1. Autenticando usuário...');
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'teste@clickmarido.com.br',
      password: 'Teste@123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('[OK] Autenticado com sucesso.\n');

    // 2. Criar Lead Individual (POST /api/leads)
    console.log('2. Testando criação manual de lead...');
    const newLeadRes = await axios.post(`${baseUrl}/api/leads`, {
      name: 'Lead Teste Audit',
      phone: '11999998888',
      email: 'lead.audit@email.com',
      channel: 'Google Ads',
      campaign: 'Campanha CRM Nova',
      status: 'QUENTE',
      notes: 'Lead criado via script de auditoria para testar integração.'
    }, { headers });
    
    const lead = newLeadRes.data;
    console.log('[OK] Lead criado com sucesso!');
    console.log(`ID: ${lead.id}, Nome: ${lead.name}, Status: ${lead.status}, Canal: ${lead.source?.channel}\n`);

    // 3. Atualizar Etapa (PUT /api/leads/[id])
    console.log('3. Testando movimentação de etapa do lead...');
    const updateStageRes = await axios.put(`${baseUrl}/api/leads/${lead.id}`, {
      funnelStage: 'EM_TRIAGEM'
    }, { headers });
    console.log('[OK] Etapa atualizada com sucesso!');
    console.log(`Nova etapa: ${updateStageRes.data.funnelStage}\n`);

    // 4. Registrar Follow-up (POST /api/leads/[id]/followup)
    console.log('4. Testando registro de interações (Follow-up)...');
    const followupRes = await axios.post(`${baseUrl}/api/leads/${lead.id}/followup`, {
      notes: 'Ligação realizada. Cliente demonstrou alto interesse em manutenção elétrica.'
    }, { headers });
    console.log('[OK] Interação registrada com sucesso!');
    console.log(`Notas: ${followupRes.data.notes}\n`);

    // 5. Registrar Agendamento (POST /api/leads/[id]/appointment)
    console.log('5. Testando agendamento comercial...');
    const appointmentRes = await axios.post(`${baseUrl}/api/leads/${lead.id}/appointment`, {
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // amanhã
      notes: 'Visita técnica no local para orçamento detalhado.'
    }, { headers });
    console.log('[OK] Agendamento criado com sucesso!');
    console.log(`Compromisso em: ${appointmentRes.data.scheduledAt}\n`);

    // 6. Testar Importação em Lote (POST /api/leads/bulk)
    console.log('6. Testando importação de leads em lote (Bulk)...');
    const bulkRes = await axios.post(`${baseUrl}/api/leads/bulk`, {
      leads: [
        { name: 'Lote Lead 1', phone: '11977776666', email: 'lote1@email.com', channel: 'Instagram', campaign: 'Promo Julho' },
        { name: 'Lote Lead 2', phone: '11966665555', email: 'lote2@email.com', channel: 'WhatsApp', campaign: 'Indicação' }
      ]
    }, { headers });
    console.log('[OK] Importação em lote realizada!');
    console.log(`Quantidade importada: ${bulkRes.data.count}\n`);

    // 7. Testar Qualificação e Encaminhamento para Orçamentos (POST /api/leads/[id]/qualify)
    console.log('7. Testando Qualificação e Encaminhamento para Orçamentos...');
    const qualifyRes = await axios.post(`${baseUrl}/api/leads/${lead.id}/qualify`, {}, { headers });
    console.log('[OK] Lead qualificado com sucesso!');
    console.log(`Cliente Criado/Encontrado ID: ${qualifyRes.data.customerId}`);
    console.log(`Orçamento Rascunho Criado ID: ${qualifyRes.data.quotationId}`);
    console.log(`Orçamento Número: ${qualifyRes.data.quotationNumber}\n`);

    // 8. Consultar Histórico de Eventos (GET /api/leads/[id]/events)
    console.log('8. Consultando timeline de histórico de eventos (Auditoria comercial)...');
    const eventsRes = await axios.get(`${baseUrl}/api/leads/${lead.id}/events`, { headers });
    console.log('[OK] Histórico retornado!');
    console.log(`Quantidade de eventos auditados: ${eventsRes.data.length}`);
    eventsRes.data.forEach((evt, idx) => {
      console.log(`  Event #${idx + 1}: [${evt.type}] - ${evt.notes}`);
    });
    console.log('');

    // 9. Testar API de Insights expandida (GET /api/leads/insights)
    console.log('9. Consultando cockpit analítico de Insights comerciais...');
    const insightsRes = await axios.get(`${baseUrl}/api/leads/insights`, { headers });
    console.log('[OK] Insights carregados!');
    console.log(`Total Leads: ${insightsRes.data.totalLeads}`);
    console.log(`Taxa de Qualificação: ${insightsRes.data.qualifiedLeads} leads`);
    console.log(`Taxa de Conversão para Orçamento: ${insightsRes.data.forwardingRate}% (${insightsRes.data.leadsForwardedToQuotation} encaminhados)`);
    console.log('Eficiência por Canal de Origem:');
    console.log(insightsRes.data.efficiencyBySource);
    console.log('Eficiência por Campanha:');
    console.log(insightsRes.data.efficiencyByCampaign);
    console.log('');

    console.log('=== AUDITORIA CONCLUÍDA COM 100% DE SUCESSO! ===');

  } catch (error) {
    console.error('=== FALHA NA AUDITORIA DO CRM ===');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runCrmAudit();
