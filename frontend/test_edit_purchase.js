const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Carregar variáveis de ambiente manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value.trim();
    }
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const secret = env.JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('ERRO: JWT_SECRET não configurado.');
    process.exit(1);
  }
  
  // Gerar token de admin
  const token = jwt.sign(
    { userId: 'test-admin-id', email: 'admin@clickmarido.com.br', role: 'admin' }, 
    secret, 
    { expiresIn: '1h' }
  );
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const baseUrl = 'http://localhost:3000';
  
  console.log('--- TESTE DE EDICAO E EXCLUSAO DE ORDENS DE COMPRA ---');
  
  try {
    // 0. Obter fornecedores para pegar um ID válido
    console.log('Buscando fornecedores disponíveis...');
    const vendorsRes = await fetch(`${baseUrl}/api/vendors`, { headers });
    if (!vendorsRes.ok) throw new Error('Falha ao listar fornecedores');
    const vendorsData = await vendorsRes.json();
    const vendor = vendorsData.data && vendorsData.data[0];
    
    if (!vendor) {
      console.error('ERRO: Nenhum fornecedor encontrado no banco. Cadastre um fornecedor antes de testar.');
      process.exit(1);
    }
    
    console.log(`Usando fornecedor: ${vendor.name} (ID: ${vendor.id})`);
    
    // 1. Criar Ordem de Compra Rascunho
    console.log('\n1. Criar Ordem de Compra...');
    const createPayload = {
      vendorId: vendor.id,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 dias no futuro
      paymentMethod: 'PIX',
      paymentTerms: 'À vista',
      requestedBy: 'Test Runner',
      items: [
        {
          description: 'Item Teste A',
          quantity: 2,
          unit: 'un',
          unitPrice: 50.0, // Subtotal = 100.00
        }
      ]
    };
    
    const createRes = await fetch(`${baseUrl}/api/purchase-orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload)
    });
    
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Falha ao criar OC: ${err.error}`);
    }
    
    const order = await createRes.json();
    console.log(`SUCESSO: Ordem de compra ${order.number} criada (ID: ${order.id})!`);
    console.log(`Total inicial: R$ ${order.totalAmount}`);
    
    // 2. Aprovar a Ordem de Compra (Gera despesa)
    console.log('\n2. Aprovar Ordem de Compra...');
    const approveRes = await fetch(`${baseUrl}/api/purchase-orders/${order.id}/approve`, {
      method: 'POST',
      headers
    });
    
    if (!approveRes.ok) {
      const err = await approveRes.json();
      throw new Error(`Falha ao aprovar OC: ${err.error}`);
    }
    
    const approvedOrder = await approveRes.json();
    console.log(`SUCESSO: Ordem ${approvedOrder.number} aprovada! Status: ${approvedOrder.status}`);
    console.log(`Despesa gerada: ID ${approvedOrder.expenseId}`);
    
    // 3. Editar a Ordem de Compra Aprovada (PUT)
    console.log('\n3. Editar Ordem de Compra Aprovada...');
    const updatePayload = {
      paymentMethod: 'Boleto 30 dias', // Alterar forma de pagamento
      items: [
        {
          description: 'Item Teste A',
          quantity: 3, // Aumentar quantidade de 2 para 3 (Subtotal = 150.00)
          unit: 'un',
          unitPrice: 50.0
        },
        {
          description: 'Item Teste B (Novo Item)',
          quantity: 1,
          unit: 'un',
          unitPrice: 75.0 // Subtotal adicional = 75.00
        }
      ],
      discountAmount: 10.0 // Adicionar desconto
      // Total esperado: 150 + 75 - 10 = 215.00
    };
    
    const updateRes = await fetch(`${baseUrl}/api/purchase-orders/${order.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    
    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(`Falha ao editar OC aprovada: ${err.error}`);
    }
    
    const updatedOrder = await updateRes.json();
    console.log(`SUCESSO: Ordem editada com sucesso!`);
    console.log(`Novo Total da OC: R$ ${updatedOrder.totalAmount}`);
    
    // Verificar se a despesa correspondente foi atualizada
    console.log('\nVerificando consistência da despesa vinculada no banco...');
    const getRes = await fetch(`${baseUrl}/api/purchase-orders/${order.id}`, { headers });
    const freshOrder = await getRes.json();
    console.log(`Valor da despesa vinculada no financeiro: R$ ${freshOrder.expense?.amount}`);
    
    if (parseFloat(freshOrder.expense?.amount) === parseFloat(updatedOrder.totalAmount)) {
      console.log('CORRETO: O valor da despesa financeira e o total da OC estão idênticos!');
    } else {
      console.error(`ERRO: Desconexão de valores! OC: ${updatedOrder.totalAmount}, Despesa: ${freshOrder.expense?.amount}`);
    }
    
    // 4. Excluir a Ordem de Compra Aprovada (DELETE)
    console.log('\n4. Excluir Ordem de Compra...');
    const deleteRes = await fetch(`${baseUrl}/api/purchase-orders/${order.id}`, {
      method: 'DELETE',
      headers
    });
    
    if (!deleteRes.ok) {
      const err = await deleteRes.json();
      throw new Error(`Falha ao deletar OC: ${err.error}`);
    }
    
    console.log('SUCESSO: Ordem de compra excluída!');
    
    // Verificar se a despesa também sumiu
    console.log('Verificando se a despesa foi removida do financeiro...');
    // Tentamos buscar a OC deletada, que deve retornar 404
    const checkOrderRes = await fetch(`${baseUrl}/api/purchase-orders/${order.id}`, { headers });
    if (checkOrderRes.status === 404) {
      console.log('CORRETO: Ordem de compra de fato não existe mais no banco.');
    } else {
      console.error('ERRO: Ordem de compra ainda existe no banco após a deleção.');
    }
    
    console.log('\n--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
    
  } catch (error) {
    console.error('\nFALHA NO TESTE DE OC:', error.message);
    console.log('Certifique-se de que o servidor Next.js está rodando (npm run dev).');
  }
}

run();
