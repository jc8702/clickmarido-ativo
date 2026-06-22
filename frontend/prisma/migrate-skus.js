const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FAMILY_CODES = {
  'Hidráulica': 'HID',
  'Elétrica': 'ELE',
  'Marcenaria': 'MAR',
  'Instalação': 'INS',
  'Montagem de Móveis': 'MON',
  'Limpeza': 'LIM',
};

function getFamilyCode(category) {
  const normalized = (category || '').trim();
  return FAMILY_CODES[normalized] || 'GER';
}

function generateSku(familyCode, sequence) {
  const seq = String(sequence).padStart(3, '0');
  return `SRV-${familyCode}-${seq}`;
}

async function main() {
  console.log('=== Migração de SKUs para novo formato SRV-FAM-XXX ===\n');

  // Buscar todos os produtos ordenados por categoria e nome
  const products = await prisma.product.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      type: true,
    },
  });

  console.log(`Total de produtos encontrados: ${products.length}\n`);

  // Agrupar por família
  const byFamily = {};
  for (const p of products) {
    const fam = getFamilyCode(p.category);
    if (!byFamily[fam]) byFamily[fam] = [];
    byFamily[fam].push(p);
  }

  let atualizados = 0;
  let erros = 0;
  const log = [];

  // Processar cada família
  for (const [famCode, famProducts] of Object.entries(byFamily)) {
    console.log(`\n--- Família: ${famCode} (${famProducts.length} produtos) ---`);

    for (let i = 0; i < famProducts.length; i++) {
      const product = famProducts[i];
      const newSku = generateSku(famCode, i + 1);

      if (product.sku === newSku) {
        console.log(`  [OK] ${product.sku} (já correto): ${product.name}`);
        continue;
      }

      try {
        // Verificar se o novo SKU já existe (de outro produto)
        const existing = await prisma.product.findFirst({
          where: {
            sku: newSku,
            id: { not: product.id },
          },
        });

        if (existing) {
          console.log(`  [SKIP] ${newSku} já existe para: ${existing.name}`);
          continue;
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { sku: newSku },
        });

        console.log(`  [UPDATE] ${product.sku} → ${newSku} | ${product.name}`);
        log.push({ old: product.sku, new: newSku, name: product.name, family: famCode });
        atualizados++;
      } catch (err) {
        console.error(`  [ERRO] ${product.name}: ${err.message}`);
        erros++;
      }
    }
  }

  console.log('\n=== Resumo da Migração ===');
  console.log(`Atualizados: ${atualizados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Total: ${products.length}`);

  // Salvar log
  if (log.length > 0) {
    const fs = require('fs');
    const logPath = __dirname + '/sku-migration-log.json';
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(`\nLog salvo em: ${logPath}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
