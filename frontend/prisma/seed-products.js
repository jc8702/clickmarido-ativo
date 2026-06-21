const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const servicos = [
  { nome: "Ajuste porta de madeira (Unidade)", slug: "ajuste-porta-de-madeira-unidade", descricao: "Execução profissional do serviço: Ajuste porta de madeira (Unidade).", categoria: "Marcenaria", preco: 60.0 },
  { nome: "Consertar Vazamentos Janelas/Pias/Banheiros", slug: "consertar-vazamentos-janelas-pias-banheiros", descricao: "Execução profissional do serviço: Consertar Vazamentos Janelas/Pias/Banheiros.", categoria: "Hidráulica", preco: 70.0 },
  { nome: "Conversão lâmpada reator x LED", slug: "conversao-lampada-reator-x-led", descricao: "Execução profissional do serviço: Conversão lâmpada reator x LED.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Desentupimento vaso sanitário e mictório", slug: "desentupimento-vaso-sanitario-e-mictorio", descricao: "Execução profissional do serviço: Desentupimento vaso sanitário e mictório.", categoria: "Hidráulica", preco: 120.0 },
  { nome: "Desmontagem de guarda-roupa", slug: "desmontagem-de-guarda-roupa", descricao: "Execução profissional do serviço: Desmontagem de guarda-roupa.", categoria: "Montagem de Móveis", preco: 70.0 },
  { nome: "Instalar Disjuntor (Unidade)", slug: "instalar-disjuntor-unidade", descricao: "Execução profissional do serviço: Instalar Disjuntor (Unidade).", categoria: "Elétrica", preco: 60.0 },
  { nome: "Instalar/Substituir Tomadas (Unidade)", slug: "instalar-substituir-tomadas-unidade", descricao: "Execução profissional do serviço: Instalar/Substituir Tomadas (Unidade).", categoria: "Elétrica", preco: 50.0 },
  { nome: "Instalar/Trocar Interruptores (Unidade)", slug: "instalar-trocar-interruptores-unidade", descricao: "Execução profissional do serviço: Instalar/Trocar Interruptores (Unidade).", categoria: "Elétrica", preco: 50.0 },
  { nome: "Instalar ponto de rede de internet e cabeamento", slug: "instalar-ponto-de-rede-de-internet-e-cabeamento", descricao: "Execução profissional do serviço: Instalar ponto de rede de internet e cabeamento.", categoria: "Instalação", preco: 70.0 },
  { nome: "Instalar lustre, luminária ou spot simples", slug: "instalar-lustre-luminaria-ou-spot-simples", descricao: "Execução profissional do serviço: Instalar lustre, luminária ou spot simples.", categoria: "Elétrica", preco: 50.0 },
  { nome: "Instalar/Trocar Sensor de presença", slug: "instalar-trocar-sensor-de-presenca", descricao: "Execução profissional do serviço: Instalar/Trocar Sensor de presença.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Instalar ponto de água adicional (externo parede) tubulação aparente", slug: "instalar-ponto-de-agua-adicional-externo-parede-tubulacao-aparente", descricao: "Execução profissional do serviço: Instalar ponto de água adicional (externo parede) tubulação aparente.", categoria: "Hidráulica", preco: 70.0 },
  { nome: "Instalar ponto de água adicional (interno parede) tubulação aparente", slug: "instalar-ponto-de-agua-adicional-interno-parede-tubulacao-aparente", descricao: "Execução profissional do serviço: Instalar ponto de água adicional (interno parede) tubulação aparente.", categoria: "Hidráulica", preco: 70.0 },
  { nome: "Instalar Máquina de Lavar Roupa", slug: "instalar-maquina-de-lavar-roupa", descricao: "Execução profissional do serviço: Instalar Máquina de Lavar Roupa.", categoria: "Instalação", preco: 80.0 },
  { nome: "Instalar Máquina de Lavar Louça", slug: "instalar-maquina-de-lavar-louca", descricao: "Execução profissional do serviço: Instalar Máquina de Lavar Louça.", categoria: "Instalação", preco: 80.0 },
  { nome: "Instalar Torneira Elétrica com ponto elétrico definido", slug: "instalar-torneira-eletrica-com-ponto-eletrico-definido", descricao: "Execução profissional do serviço: Instalar Torneira Elétrica com ponto elétrico definido.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Instalar Filtro ou purificador de Água", slug: "instalar-filtro-ou-purificador-de-agua", descricao: "Execução profissional do serviço: Instalar Filtro ou purificador de Água.", categoria: "Hidráulica", preco: 80.0 },
  { nome: "Instalar ou substituir tanque porcelana, resina ou plástico", slug: "instalar-ou-substituir-tanque-porcelana-resina-ou-plastico", descricao: "Execução profissional do serviço: Instalar ou substituir tanque porcelana, resina ou plástico.", categoria: "Hidráulica", preco: 80.0 },
  { nome: "Instalar Quadros e Espelhos (modelo pequeno)", slug: "instalar-quadros-e-espelhos-modelo-pequeno", descricao: "Execução profissional do serviço: Instalar Quadros e Espelhos (modelo pequeno).", categoria: "Instalação", preco: 50.0 },
  { nome: "Instalar Quadros e Espelhos (modelo grande)", slug: "instalar-quadros-e-espelhos-modelo-grande", descricao: "Execução profissional do serviço: Instalar Quadros e Espelhos (modelo grande).", categoria: "Instalação", preco: 60.0 },
  { nome: "Instalar Ventilador de Teto (Unidade)", slug: "instalar-ventilador-de-teto-unidade", descricao: "Execução profissional do serviço: Instalar Ventilador de Teto (Unidade).", categoria: "Elétrica", preco: 90.0 },
  { nome: "Instalar Cortina (Unidade)", slug: "instalar-cortina-unidade", descricao: "Execução profissional do serviço: Instalar Cortina (Unidade).", categoria: "Instalação", preco: 70.0 },
  { nome: "Instalar Persiana (Unidade)", slug: "instalar-persiana-unidade", descricao: "Execução profissional do serviço: Instalar Persiana (Unidade).", categoria: "Instalação", preco: 70.0 },
  { nome: "Instalar Varal Teto ou Externo (Unidade)", slug: "instalar-varal-teto-ou-externo-unidade", descricao: "Execução profissional do serviço: Instalar Varal Teto ou Externo (Unidade).", categoria: "Instalação", preco: 60.0 },
  { nome: "Instalar ou Substituir Prateleiras (por unidade)", slug: "instalar-ou-substituir-prateleiras-por-unidade", descricao: "Execução profissional do serviço: Instalar ou Substituir Prateleiras (por unidade).", categoria: "Montagem de Móveis", preco: 60.0 },
  { nome: "Instalar Suporte de TV Painel ou Parede / microondas", slug: "instalar-suporte-de-tv-painel-ou-parede-microondas", descricao: "Execução profissional do serviço: Instalar Suporte de TV Painel ou Parede / microondas.", categoria: "Instalação", preco: 60.0 },
  { nome: "Instalação e limpeza de chuveiro elétrico ou eletrônico", slug: "instalacao-e-limpeza-de-chuveiro-eletrico-ou-eletronico", descricao: "Execução profissional do serviço: Instalação e limpeza de chuveiro elétrico ou eletrônico.", categoria: "Elétrica", preco: 50.0 },
  { nome: "Instalação ou substituição vaso sanitário", slug: "instalacao-ou-substituicao-vaso-sanitario", descricao: "Execução profissional do serviço: Instalação ou substituição vaso sanitário.", categoria: "Hidráulica", preco: 150.0 },
  { nome: "Instalação de acessórios de banheiro", slug: "instalacao-de-acessorios-de-banheiro", descricao: "Execução profissional do serviço: Instalação de acessórios de banheiro.", categoria: "Instalação", preco: 70.0 },
  { nome: "Instalação de ducha higiênica", slug: "instalacao-de-ducha-higienica", descricao: "Execução profissional do serviço: Instalação de ducha higiênica.", categoria: "Hidráulica", preco: 60.0 },
  { nome: "Instalação de olho mágico", slug: "instalacao-de-olho-magico", descricao: "Execução profissional do serviço: Instalação de olho mágico.", categoria: "Instalação", preco: 60.0 },
  { nome: "Instalação de plafon simples", slug: "instalacao-de-plafon-simples", descricao: "Execução profissional do serviço: Instalação de plafon simples.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Instalação de cooktop", slug: "instalacao-de-cooktop", descricao: "Execução profissional do serviço: Instalação de cooktop.", categoria: "Instalação", preco: 90.0 },
  { nome: "Instalação de coifa/depurador", slug: "instalacao-de-coifa-depurador", descricao: "Execução profissional do serviço: Instalação de coifa/depurador.", categoria: "Instalação", preco: 120.0 },
  { nome: "Instalação de campainha sem fio", slug: "instalacao-de-campainha-sem-fio", descricao: "Execução profissional do serviço: Instalação de campainha sem fio.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Limpeza Caixa D'água Telhado Simples até 1.000 litros", slug: "limpeza-caixa-dagua-telhado-simples-ate-1-000-litros", descricao: "Execução profissional do serviço: Limpeza Caixa D'água Telhado Simples até 1.000 litros.", categoria: "Hidráulica", preco: 80.0 },
  { nome: "Limpeza Caixa D'água Telhado Sobrado até 1.000 litros", slug: "limpeza-caixa-dagua-telhado-sobrado-ate-1-000-litros", descricao: "Execução profissional do serviço: Limpeza Caixa D'água Telhado Sobrado até 1.000 litros.", categoria: "Hidráulica", preco: 100.0 },
  { nome: "Limpeza de caixa de gordura residencial", slug: "limpeza-de-caixa-de-gordura-residencial", descricao: "Execução profissional do serviço: Limpeza de caixa de gordura residencial.", categoria: "Hidráulica", preco: 100.0 },
  { nome: "Limpeza Calha Telhado Simples", slug: "limpeza-calha-telhado-simples", descricao: "Execução profissional do serviço: Limpeza Calha Telhado Simples.", categoria: "Limpeza", preco: 120.0 },
  { nome: "Limpeza Calha Telhado Sobrado", slug: "limpeza-calha-telhado-sobrado", descricao: "Execução profissional do serviço: Limpeza Calha Telhado Sobrado.", categoria: "Limpeza", preco: 200.0 },
  { nome: "Manutenção Portas e Gavetas de Armários (unidade)", slug: "manutencao-portas-e-gavetas-de-armarios-unidade", descricao: "Execução profissional do serviço: Manutenção Portas e Gavetas de Armários (unidade).", categoria: "Marcenaria", preco: 40.0 },
  { nome: "Manutenção em portas de correr", slug: "manutencao-em-portas-de-correr", descricao: "Execução profissional do serviço: Manutenção em portas de correr.", categoria: "Marcenaria", preco: 100.0 },
  { nome: "Manutenção Janelas", slug: "manutencao-janelas", descricao: "Execução profissional do serviço: Manutenção Janelas.", categoria: "Marcenaria", preco: 70.0 },
  { nome: "Mão de obra por hora", slug: "mao-de-obra-por-hora", descricao: "Execução profissional do serviço: Mão de obra por hora.", categoria: "Instalação", preco: 50.0, unit: "h" },
  { nome: "Mão de obra por dia", slug: "mao-de-obra-por-dia", descricao: "Execução profissional do serviço: Mão de obra por dia.", categoria: "Instalação", preco: 220.0 },
  { nome: "Montagem e instalação de nicho (até 2 unidades)", slug: "montagem-e-instalacao-de-nicho-ate-2-unidades", descricao: "Execução profissional do serviço: Montagem e instalação de nicho (até 2 unidades).", categoria: "Montagem de Móveis", preco: 70.0 },
  { nome: "Montagem de ventilador", slug: "montagem-de-ventilador", descricao: "Execução profissional do serviço: Montagem de ventilador.", categoria: "Elétrica", preco: 50.0 },
  { nome: "Montagem de guarda-roupa solteiro", slug: "montagem-de-guarda-roupa-solteiro", descricao: "Execução profissional do serviço: Montagem de guarda-roupa solteiro.", categoria: "Montagem de Móveis", preco: 100.0 },
  { nome: "Montagem de guarda-roupa casal", slug: "montagem-de-guarda-roupa-casal", descricao: "Execução profissional do serviço: Montagem de guarda-roupa casal.", categoria: "Montagem de Móveis", preco: 150.0 },
  { nome: "Montagem de móveis médios", slug: "montagem-de-moveis-medios", descricao: "Execução profissional do serviço: Montagem de móveis médios.", categoria: "Montagem de Móveis", preco: 120.0 },
  { nome: "Manutenção em vaso sanitário/vazamento", slug: "manutencao-em-vaso-sanitario-vazamento", descricao: "Execução profissional do serviço: Manutenção em vaso sanitário/vazamento.", categoria: "Hidráulica", preco: 120.0 },
  { nome: "Mudança de móveis de local ou ambiente (unidade)", slug: "mudanca-de-moveis-de-local-ou-ambiente-unidade", descricao: "Execução profissional do serviço: Mudança de móveis de local ou ambiente (unidade).", categoria: "Montagem de Móveis", preco: 40.0 },
  { nome: "Pintura reparadora de paredes (por parede do ambiente)", slug: "pintura-reparadora-de-paredes-por-parede-do-ambiente", descricao: "Execução profissional do serviço: Pintura reparadora de paredes (por parede do ambiente).", categoria: "Instalação", preco: 90.0 },
  { nome: "Revisão elétrica (ponto simples)", slug: "revisao-eletrica-ponto-simples", descricao: "Execução profissional do serviço: Revisão elétrica (ponto simples).", categoria: "Elétrica", preco: 60.0 },
  { nome: "Substituir Lâmpada comum até 1 unidade", slug: "substituir-lampada-comum-ate-1-unidade", descricao: "Execução profissional do serviço: Substituir Lâmpada comum até 1 unidade.", categoria: "Elétrica", preco: 50.0 },
  { nome: "Substituir Lâmpada comum acima de 1 unidade", slug: "substituir-lampada-comum-acima-de-1-unidade", descricao: "Execução profissional do serviço: Substituir Lâmpada comum acima de 1 unidade.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Substituir Lâmpadas (até 3 unidades)", slug: "substituir-lampadas-ate-3-unidades", descricao: "Execução profissional do serviço: Substituir Lâmpadas (até 3 unidades).", categoria: "Elétrica", preco: 100.0 },
  { nome: "Substituir Lâmpada fluorescente até 1 unidade", slug: "substituir-lampada-fluorescente-ate-1-unidade", descricao: "Execução profissional do serviço: Substituir Lâmpada fluorescente até 1 unidade.", categoria: "Elétrica", preco: 40.0 },
  { nome: "Substituir Lâmpada fluorescente acima de 1 unidade", slug: "substituir-lampada-fluorescente-acima-de-1-unidade", descricao: "Execução profissional do serviço: Substituir Lâmpada fluorescente acima de 1 unidade.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Substituir Lâmpada de refletor até 1 unidade até 2 metros de altura", slug: "substituir-lampada-de-refletor-ate-1-unidade-ate-2-metros-de-altura", descricao: "Execução profissional do serviço: Substituir Lâmpada de refletor até 1 unidade até 2 metros de altura.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Substituir ou Consertar Vazamentos Sifão (vedantes)", slug: "substituir-ou-consertar-vazamentos-sifao-vedantes", descricao: "Execução profissional do serviço: Substituir ou Consertar Vazamentos Sifão (vedantes).", categoria: "Hidráulica", preco: 60.0 },
  { nome: "Substituir ou Consertar Torneiras Simples (vedantes/unidade)", slug: "substituir-ou-consertar-torneiras-simples-vedantes-unidade", descricao: "Execução profissional do serviço: Substituir ou Consertar Torneiras Simples (vedantes/unidade).", categoria: "Hidráulica", preco: 60.0 },
  { nome: "Substituir ou Consertar Torneiras c/ misturador (vedantes/unidade)", slug: "substituir-ou-consertar-torneiras-c-misturador-vedantes-unidade", descricao: "Execução profissional do serviço: Substituir ou Consertar Torneiras c/ misturador (vedantes/unidade).", categoria: "Hidráulica", preco: 80.0 },
  { nome: "Substituir Reparo Descarga ou Caixa Acoplada Simples (Parcial) entrada de água ou saída", slug: "substituir-reparo-descarga-ou-caixa-acoplada-simples-parcial-entrada-de-agua-ou-saida", descricao: "Execução profissional do serviço: Substituir Reparo Descarga ou Caixa Acoplada Simples (Parcial) entrada de água ou saída.", categoria: "Hidráulica", preco: 70.0 },
  { nome: "Substituir Reparo Descarga ou Caixa Acoplada Simples (Completo)", slug: "substituir-reparo-descarga-ou-caixa-acoplada-simples-completo", descricao: "Execução profissional do serviço: Substituir Reparo Descarga ou Caixa Acoplada Simples (Completo).", categoria: "Hidráulica", preco: 100.0 },
  { nome: "Substituir reparo válvula Hydra", slug: "substituir-reparo-valvula-hydra", descricao: "Execução profissional do serviço: Substituir reparo válvula Hydra.", categoria: "Instalação", preco: 90.0 },
  { nome: "Substituir reparo válvula Docol", slug: "substituir-reparo-valvula-docol", descricao: "Execução profissional do serviço: Substituir reparo válvula Docol.", categoria: "Instalação", preco: 80.0 },
  { nome: "Substituir reparo válvula Oriente", slug: "substituir-reparo-valvula-oriente", descricao: "Execução profissional do serviço: Substituir reparo válvula Oriente.", categoria: "Instalação", preco: 120.0 },
  { nome: "Substituir ou instalar tampa de vaso sanitário", slug: "substituir-ou-instalar-tampa-de-vaso-sanitario", descricao: "Execução profissional do serviço: Substituir ou instalar tampa de vaso sanitário.", categoria: "Hidráulica", preco: 50.0 },
  { nome: "Substituir Bóia Caixa D'água", slug: "substituir-boia-caixa-dagua", descricao: "Execução profissional do serviço: Substituir Bóia Caixa D'água.", categoria: "Hidráulica", preco: 90.0 },
  { nome: "Substituir Telha Comum Telhado Simples (unidade)", slug: "substituir-telha-comum-telhado-simples-unidade", descricao: "Execução profissional do serviço: Substituir Telha Comum Telhado Simples (unidade).", categoria: "Instalação", preco: 60.0 },
  { nome: "Substituir Telha Comum Telhado Sobrado (unidade)", slug: "substituir-telha-comum-telhado-sobrado-unidade", descricao: "Execução profissional do serviço: Substituir Telha Comum Telhado Sobrado (unidade).", categoria: "Instalação", preco: 90.0 },
  { nome: "Substituir ou Instalar Botijão de Gás", slug: "substituir-ou-instalar-botijao-de-gas", descricao: "Execução profissional do serviço: Substituir ou Instalar Botijão de Gás.", categoria: "Instalação", preco: 50.0 },
  { nome: "Substituir Válvula ou mangueira de Gás", slug: "substituir-valvula-ou-mangueira-de-gas", descricao: "Execução profissional do serviço: Substituir Válvula ou mangueira de Gás.", categoria: "Instalação", preco: 60.0 },
  { nome: "Substituir Fechadura Porta ou Janela (Comum/Unidade)", slug: "substituir-fechadura-porta-ou-janela-comum-unidade", descricao: "Execução profissional do serviço: Substituir Fechadura Porta ou Janela (Comum/Unidade).", categoria: "Marcenaria", preco: 60.0 },
  { nome: "Substituir Dobradiça (Porta Comum/Unidade)", slug: "substituir-dobradica-porta-comum-unidade", descricao: "Execução profissional do serviço: Substituir Dobradiça (Porta Comum/Unidade).", categoria: "Marcenaria", preco: 60.0 },
  { nome: "Substituição ou Instalação Porta simples (Porta madeira)", slug: "substituicao-ou-instalacao-porta-simples-porta-madeira", descricao: "Execução profissional do serviço: Substituição ou Instalação Porta simples (Porta madeira).", categoria: "Marcenaria", preco: 100.0 },
  { nome: "Substituição Pisos e Azulejos (peças cada)", slug: "substituicao-pisos-e-azulejos-pecas-cada", descricao: "Execução profissional do serviço: Substituição Pisos e Azulejos (peças cada).", categoria: "Instalação", preco: 40.0 },
  { nome: "Trocar Resistência Chuveiro Elétrico ou Eletrônico", slug: "trocar-resistencia-chuveiro-eletrico-ou-eletronico", descricao: "Execução profissional do serviço: Trocar Resistência Chuveiro Elétrico ou Eletrônico.", categoria: "Elétrica", preco: 60.0 },
  { nome: "Trocar registro de chuveiro", slug: "trocar-registro-de-chuveiro", descricao: "Execução profissional do serviço: Trocar registro de chuveiro.", categoria: "Hidráulica", preco: 60.0 },
  { nome: "Trocar Disjuntor (Unidade)", slug: "trocar-disjuntor-unidade", descricao: "Execução profissional do serviço: Trocar Disjuntor (Unidade).", categoria: "Elétrica", preco: 40.0 },
  { nome: "Taxa extra serviços no raio entre 10 a 15 KM", slug: "taxa-extra-servicos-no-raio-entre-10-a-15-km", descricao: "Execução profissional do serviço: Taxa extra serviços no raio entre 10 a 15 KM.", categoria: "Instalação", preco: 20.0 },
  { nome: "Vedação com silicone (pia ou banheira ou box)", slug: "vedacao-com-silicone-pia-ou-banheira-ou-box", descricao: "Execução profissional do serviço: Vedação com silicone (pia ou banheira ou box).", categoria: "Instalação", preco: 90.0 },
];

function generateSku(nome) {
  const prefixo = 'SRV';
  const slug = nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const partes = slug.split('-').filter(Boolean);
  const abreviado = partes.slice(0, 4).map(p => p.substring(0, 3).toUpperCase()).join('');
  return `${prefixo}-${abreviado}`;
}

async function main() {
  console.log('Iniciando cadastro de serviços...\n');

  let cadastrados = 0;
  let erros = 0;

  for (const s of servicos) {
    const sku = generateSku(s.nome);

    try {
      const existing = await prisma.product.findFirst({ where: { sku } });
      if (existing) {
        console.log(`[SKIP] SKU ${sku} já existe: ${s.nome}`);
        continue;
      }

      await prisma.product.create({
        data: {
          name: s.nome,
          sku,
          type: 'SERVICO',
          description: s.descricao,
          price: s.preco,
          unit: s.unit || 'un',
          category: s.categoria,
          active: true,
        },
      });

      console.log(`[OK] ${sku} | ${s.nome} | R$ ${s.preco.toFixed(2)} | ${s.categoria}`);
      cadastrados++;
    } catch (err) {
      console.error(`[ERRO] ${s.nome}: ${err.message}`);
      erros++;
    }
  }

  console.log(`\n--- Resumo ---`);
  console.log(`Cadastrados: ${cadastrados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Total: ${servicos.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
