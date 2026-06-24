const BASE_URL = 'https://clickmarido-ativo-frontend.vercel.app';

const RESULTS = [];
let AUTH_TOKEN = null;

// ─── Helpers ────────────────────────────────────────────────
function log(emoji, msg) { console.log(`${emoji} ${msg}`); }

async function request(method, path, { body, headers = {} } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function record(name, expected, actual, detail = '') {
  const pass = Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected;
  const status = pass ? 'PASS' : 'FAIL';
  const emoji = pass ? '✅' : '❌';
  RESULTS.push({ name, expected, actual, status, detail });
  log(emoji, `${status} | ${name} | expected=${expected} got=${actual}`);
  if (!pass && detail) log('  ↳', detail);
  return pass;
}

// ─── Auth ───────────────────────────────────────────────────
async function testLogin() {
  log('🔑', 'Testando login...');

  // 1. Login com credenciais inválidas
  const r1 = await request('POST', '/api/auth/login', {
    body: { email: 'invalido@test.com', password: 'senhaerrada' },
  });
  record('Login com credenciais inválidas', 401, r1.status);

  // 2. Login com campos faltando
  const r2 = await request('POST', '/api/auth/login', {
    body: { email: 'teste@clickmarido.com.br' },
  });
  record('Login com senha faltando', 400, r2.status);

  // 3. Login válido
  const r3 = await request('POST', '/api/auth/login', {
    body: { email: 'teste@clickmarido.com.br', password: 'Teste@123' },
  });
  const ok = record('Login com credenciais válidas', 200, r3.status);
  if (ok && r3.json?.token) {
    AUTH_TOKEN = r3.json.token;
    log('  ↳', `Token obtido (${AUTH_TOKEN.substring(0, 20)}...)`);
  }

  // 4. Verificar token
  if (AUTH_TOKEN) {
    const r4 = await request('GET', '/api/auth/verify', {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    record('Verificar token válido', 200, r4.status);
  }

  // 5. Token inválido
  const r5 = await request('GET', '/api/auth/verify', {
    headers: { Authorization: 'Bearer token_invalido_123' },
  });
  record('Verificar token inválido', 401, r5.status);

  // 6. Sem token
  const r6 = await request('GET', '/api/auth/verify');
  record('Verificar sem token', 401, r6.status);
}

// ─── Rotas protegidas (401 sem auth) ────────────────────────
async function testProtectedRoutes() {
  log('🔒', 'Testando rotas protegidas sem auth...');
  const routes = [
    ['GET', '/api/products'],
    ['GET', '/api/customers'],
    ['GET', '/api/payments'],
    ['GET', '/api/warranties'],
    ['GET', '/api/purchase-orders'],
    ['GET', '/api/service-orders'],
    ['GET', '/api/dashboard'],
    ['GET', '/api/quotation-items'],
  ];

  for (const [method, path] of routes) {
    const r = await request(method, path);
    record(`${method} ${path} sem auth → 401`, 401, r.status);
  }
}

// ─── Produtos ───────────────────────────────────────────────
async function testProducts() {
  log('📦', 'Testando produtos...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/products', { headers: h });
  record('GET /api/products → 200', 200, r1.status);

  const r2 = await request('POST', '/api/products', {
    headers: h,
    body: { name: 'Teste API', sku: 'TEST-001', price: 99.99, type: 'PECA', unit: 'un' },
  });
  record('POST /api/products → 201', 201, r2.status);
}

// ─── Clientes ───────────────────────────────────────────────
async function testCustomers() {
  log('👤', 'Testando clientes...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/customers', { headers: h });
  record('GET /api/customers → 200', 200, r1.status);
}

// ─── Payments ───────────────────────────────────────────────
async function testPayments() {
  log('💳', 'Testando pagamentos...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  // GET payments
  const r1 = await request('GET', '/api/payments', { headers: h });
  record('GET /api/payments → 200', 200, r1.status);

  // POST approve com ID inválido
  const r2 = await request('POST', '/api/payments/invalid-id/approve', { headers: h });
  record('POST /api/payments/{id}/approve (ID inválido) → 404', 404, r2.status);

  // POST approve com ID inexistente (CUID válido)
  const r3 = await request('POST', '/api/payments/clx0000000000000000000001/approve', { headers: h });
  record('POST /api/payments/{id}/approve (ID inexistente) → 404', 404, r3.status);

  // POST generate-pix com ID inválido
  const r4 = await request('POST', '/api/payments/invalid-id/generate-pix', { headers: h });
  record('POST /api/payments/{id}/generate-pix (ID inválido) → 404', 404, r4.status);

  // POST generate-pix com ID inexistente
  const r5 = await request('POST', '/api/payments/clx0000000000000000000001/generate-pix', { headers: h });
  record('POST /api/payments/{id}/generate-pix (ID inexistente) → 404', 404, r5.status);
}

// ─── Quotation Items ────────────────────────────────────────
async function testQuotationItems() {
  log('📋', 'Testando itens de orçamento...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  // GET quotation-items (sem filtro)
  const r1 = await request('GET', '/api/quotation-items', { headers: h });
  record('GET /api/quotation-items → 200', 200, r1.status);

  // GET quotation-items com filtro
  const r2 = await request('GET', '/api/quotation-items?quotationId=test', { headers: h });
  record('GET /api/quotation-items?quotationId=test → 200', 200, r2.status);
}

// ─── Dashboard ──────────────────────────────────────────────
async function testDashboard() {
  log('📊', 'Testando dashboard...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/dashboard', { headers: h });
  record('GET /api/dashboard → 200', 200, r1.status);
}

// ─── Warranties ─────────────────────────────────────────────
async function testWarranties() {
  log('🛡️', 'Testando garantias...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/warranties', { headers: h });
  record('GET /api/warranties → 200', 200, r1.status);
}

// ─── Purchase Orders ────────────────────────────────────────
async function testPurchaseOrders() {
  log('🛒', 'Testando ordens de compra...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/purchase-orders', { headers: h });
  record('GET /api/purchase-orders → 200', 200, r1.status);
}

// ─── Service Orders ─────────────────────────────────────────
async function testServiceOrders() {
  log('🔧', 'Testando ordens de serviço...');
  const h = { Authorization: `Bearer ${AUTH_TOKEN}` };

  const r1 = await request('GET', '/api/service-orders', { headers: h });
  record('GET /api/service-orders → 200', 200, r1.status);
}

// ─── Health ─────────────────────────────────────────────────
async function testHealth() {
  log('💚', 'Testando health check...');
  const r1 = await request('GET', '/api/health');
  record('GET /api/health → 200', 200, r1.status);
}

// ─── Report ─────────────────────────────────────────────────
function generateReport() {
  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const total = RESULTS.length;
  const pct = ((passed / total) * 100).toFixed(1);

  const lines = [];
  lines.push(`# Relatório de Testes - API ClickMarido`);
  lines.push(``);
  lines.push(`**Data:** ${new Date().toISOString().split('T')[0]}`);
  lines.push(`**Ambiente:** Produção (Vercel)`);
  lines.push(`**URL:** ${BASE_URL}`);
  lines.push(``);
  lines.push(`## Resumo`);
  lines.push(``);
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Total de testes | ${total} |`);
  lines.push(`| Aprovados | ${passed} ✅ |`);
  lines.push(`| Reprovados | ${failed} ❌ |`);
  lines.push(`| Taxa de aprovação | ${pct}% |`);
  lines.push(``);

  // Agrupar por categoria
  const categories = {};
  for (const r of RESULTS) {
    const cat = r.name.split(' ')[0] === 'Login' || r.name.includes('token')
      ? 'Autenticação'
      : r.name.includes('sem auth') ? 'Proteção de Rotas'
      : r.name.includes('/api/products') ? 'Produtos'
      : r.name.includes('/api/customers') ? 'Clientes'
      : r.name.includes('/api/payments') ? 'Pagamentos'
      : r.name.includes('/api/quotation') ? 'Itens de Orçamento'
      : r.name.includes('/api/dashboard') ? 'Dashboard'
      : r.name.includes('/api/warranties') ? 'Garantias'
      : r.name.includes('/api/purchase') ? 'Ordens de Compra'
      : r.name.includes('/api/service') ? 'Ordens de Serviço'
      : r.name.includes('/api/health') ? 'Health Check'
      : 'Outros';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(r);
  }

  lines.push(`## Detalhes por Categoria`);
  lines.push(``);

  for (const [cat, tests] of Object.entries(categories)) {
    const catPassed = tests.filter(t => t.status === 'PASS').length;
    lines.push(`### ${cat} (${catPassed}/${tests.length})`);
    lines.push(``);
    lines.push(`| Teste | Esperado | Obtido | Status |`);
    lines.push(`|-------|----------|--------|--------|`);
    for (const t of tests) {
      const icon = t.status === 'PASS' ? '✅' : '❌';
      lines.push(`| ${t.name} | ${t.expected} | ${t.actual} | ${icon} |`);
    }
    lines.push(``);
  }

  // Testes que falharam
  const failedTests = RESULTS.filter(r => r.status === 'FAIL');
  if (failedTests.length > 0) {
    lines.push(`## Testes Reprovados - Ação Necessária`);
    lines.push(``);
    for (const t of failedTests) {
      lines.push(`- **${t.name}**: esperado ${t.expected}, obtido ${t.actual}`);
      if (t.detail) lines.push(`  - ${t.detail}`);
    }
    lines.push(``);
  }

  // TestSprite
  lines.push(`## Testes TestSprite (UI)`);
  lines.push(``);
  lines.push(`| Teste | Resultado | Observação |`);
  lines.push(`|-------|-----------|------------|`);
  lines.push(`| Login com credenciais inválidas | ✅ PASS | Mensagem de erro exibida corretamente |`);
  lines.push('| Login com credenciais válidas | ❌ FAIL | Credenciais de exemplo (example@gmail.com) não existiam no banco |');
  lines.push('| Redirecionamento pós-login | ❌ FAIL | Falha por falta de autenticidade |');
  lines.push(``);
  lines.push('**Correção aplicada:** Usuário de teste criado (teste@clickmarido.com.br / Teste@123) e planos de teste atualizados.');
  lines.push(``);

  // Correções
  lines.push(`## Correções Aplicadas nesta Sessão`);
  lines.push(``);
  lines.push(`| # | Problema | Correção | Arquivo |`);
  lines.push(`|---|----------|----------|---------|`);
  lines.push(`| 1 | POST /api/payments/{id}/approve → 405 | Adicionado export POST | payments/[id]/approve/route.ts |`);
  lines.push(`| 2 | POST /api/payments/{id}/generate-pix → 405 | Adicionado export POST | payments/[id]/generate-pix/route.ts |`);
  lines.push(`| 3 | GET /api/quotation-items → 405 | Adicionado export GET com filtro quotationId | quotation-items/route.ts |`);
  lines.push(`| 4 | TestSprite: credenciais inválidas | Usuário de teste criado + planos atualizados | seed-test-user.js, test-plan-*.json |`);
  lines.push(``);

  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  SUÍTE DE TESTES - API ClickMarido');
  console.log('═══════════════════════════════════════════\n');

  await testLogin();
  console.log('');
  await testHealth();
  console.log('');
  await testProtectedRoutes();
  console.log('');
  await testProducts();
  console.log('');
  await testCustomers();
  console.log('');
  await testPayments();
  console.log('');
  await testQuotationItems();
  console.log('');
  await testDashboard();
  console.log('');
  await testWarranties();
  console.log('');
  await testPurchaseOrders();
  console.log('');
  await testServiceOrders();

  console.log('\n═══════════════════════════════════════════');
  const report = generateReport();
  console.log(report);

  const fs = require('fs');
  fs.writeFileSync(__dirname + '/../../../TEST-REPORT.md', report);
  console.log('\n📄 Relatório salvo em: TEST-REPORT.md');
}

main().catch(console.error);
