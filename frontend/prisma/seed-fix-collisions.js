const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const missing = [
  {
    name: "Instalar ponto de água adicional (interno parede) tubulação aparente",
    sku: "SRV-INSPONDEAGUI",
    description: "Execução profissional do serviço: Instalar ponto de água adicional (interno parede) tubulação aparente.",
    category: "Hidráulica",
    price: 70.0,
  },
  {
    name: "Instalar Máquina de Lavar Louça",
    sku: "SRV-INSMAQDELAVL",
    description: "Execução profissional do serviço: Instalar Máquina de Lavar Louça.",
    category: "Instalação",
    price: 80.0,
  },
  {
    name: "Instalar Quadros e Espelhos (modelo grande)",
    sku: "SRV-INSQUAEESPG",
    description: "Execução profissional do serviço: Instalar Quadros e Espelhos (modelo grande).",
    category: "Instalação",
    price: 60.0,
  },
  {
    name: "Limpeza Caixa D'água Telhado Sobrado até 1.000 litros",
    sku: "SRV-LIMCAIDAGTSO",
    description: "Execução profissional do serviço: Limpeza Caixa D'água Telhado Sobrado até 1.000 litros.",
    category: "Hidráulica",
    price: 100.0,
  },
  {
    name: "Mão de obra por dia",
    sku: "SRV-MAODEOBRPORD",
    description: "Execução profissional do serviço: Mão de obra por dia.",
    category: "Instalação",
    price: 220.0,
  },
  {
    name: "Montagem de guarda-roupa casal",
    sku: "SRV-MONDEGUAROUC",
    description: "Execução profissional do serviço: Montagem de guarda-roupa casal.",
    category: "Montagem de Móveis",
    price: 150.0,
  },
  {
    name: "Substituir ou Consertar Torneiras c/ misturador (vedantes/unidade)",
    sku: "SRV-SUBOUCONTORM",
    description: "Execução profissional do serviço: Substituir ou Consertar Torneiras c/ misturador (vedantes/unidade).",
    category: "Hidráulica",
    price: 80.0,
  },
  {
    name: "Substituir Reparo Descarga ou Caixa Acoplada Simples (Completo)",
    sku: "SRV-SUBREPDESOC",
    description: "Execução profissional do serviço: Substituir Reparo Descarga ou Caixa Acoplada Simples (Completo).",
    category: "Hidráulica",
    price: 100.0,
  },
  {
    name: "Substituir Telha Comum Telhado Sobrado (unidade)",
    sku: "SRV-SUBTELCOMTSO",
    description: "Execução profissional do serviço: Substituir Telha Comum Telhado Sobrado (unidade).",
    category: "Instalação",
    price: 90.0,
  },
];

async function main() {
  console.log('Corrigindo servicos com colisao de SKU...\n');

  let cadastrados = 0;
  let erros = 0;

  for (const s of missing) {
    try {
      const existing = await prisma.product.findFirst({ where: { sku: s.sku } });
      if (existing) {
        console.log(`[SKIP] SKU ${s.sku} ja existe: ${s.name}`);
        continue;
      }

      await prisma.product.create({
        data: {
          name: s.name,
          sku: s.sku,
          type: 'SERVICO',
          description: s.description,
          price: s.price,
          unit: 'un',
          category: s.category,
          active: true,
        },
      });

      console.log(`[OK] ${s.sku} | ${s.name} | R$ ${s.price.toFixed(2)} | ${s.category}`);
      cadastrados++;
    } catch (err) {
      console.error(`[ERRO] ${s.name}: ${err.message}`);
      erros++;
    }
  }

  console.log(`\n--- Resumo Correcao ---`);
  console.log(`Cadastrados: ${cadastrados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Total: ${missing.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
