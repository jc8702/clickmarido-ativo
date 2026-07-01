import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Executando migrations SQL no banco de dados...');

  // Migration 1: Lead classifications
  console.log('1/2 - Criando enums e colunas de classificação de Lead...');
  
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LeadQualificationStage" AS ENUM ('QUALIFICADO', 'PARCIALMENTE_QUALIFICADO', 'EM_VALIDACAO', 'DESQUALIFICADO', 'SEM_VALIDACAO');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LeadIntention" AS ENUM ('PESQUISANDO', 'COMPARANDO', 'PRONTO_PARA_ORCAMENTO', 'PRONTO_PARA_FECHAMENTO', 'ACOMPANHAR_DEPOIS');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LeadNextAction" AS ENUM ('LIGAR', 'RESPONDER_WHATSAPP', 'ENVIAR_PROPOSTA', 'AGENDAR_VISITA', 'AGENDAR_REUNIAO', 'PEDIR_MAIS_INFORMACOES', 'NUTRIR_LEAD', 'ENCAMINHAR_ORCAMENTO', 'DESCARTAR');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LeadLossReason" AS ENUM ('SEM_ORCAMENTO', 'SEM_TIMING', 'SEM_NECESSIDADE', 'SEM_AUTORIDADE', 'FORA_DE_PERFIL', 'CONCORRENCIA', 'RETORNO_FUTURO', 'CONTATO_INVALIDO');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LeadPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Add new columns to leads table (skip if already exist)
  const leadColumns = [
    `"priority" "LeadPriority" NOT NULL DEFAULT 'MEDIA'`,
    `"qualificationStage" "LeadQualificationStage" NOT NULL DEFAULT 'SEM_VALIDACAO'`,
    `"lastContactAt" TIMESTAMP(3)`,
    `"nextFollowupAt" TIMESTAMP(3)`,
    `"cadenceCount" INTEGER NOT NULL DEFAULT 0`,
    `"cadenceInterval" INTEGER`,
    `"riskAlert" TEXT`,
    `"riskAlertLevel" VARCHAR(20)`,
    `"bantBudget" VARCHAR(50)`,
    `"bantAuthority" VARCHAR(50)`,
    `"bantNeed" VARCHAR(50)`,
    `"bantTiming" VARCHAR(50)`,
    `"champChallenge" VARCHAR(50)`,
    `"champMoney" VARCHAR(50)`,
    `"champPriority" VARCHAR(50)`,
  ];

  for (const col of leadColumns) {
    const colName = col.split('"')[1];
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS ${col}`);
      console.log(`  + leads.${colName} adicionado`);
    } catch (e: any) {
      console.log(`  - leads.${colName} já existe ou erro: ${e.message}`);
    }
  }

  // Convert existing text columns to enum types
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "intention" TYPE "LeadIntention" USING "intention"::text::"LeadIntention"`);
    console.log('  + leads.intention convertido para enum');
  } catch (e: any) {
    console.log(`  - leads.intention: ${e.message}`);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "nextAction" TYPE "LeadNextAction" USING "nextAction"::text::"LeadNextAction"`);
    console.log('  + leads.nextAction convertido para enum');
  } catch (e: any) {
    console.log(`  - leads.nextAction: ${e.message}`);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "lossReason" TYPE "LeadLossReason" USING "lossReason"::text::"LeadLossReason"`);
    console.log('  + leads.lossReason convertido para enum');
  } catch (e: any) {
    console.log(`  - leads.lossReason: ${e.message}`);
  }

  // Migration 2: Quotation lead data
  console.log('2/2 - Adicionando campos de lead ao orçamento...');

  const quotationColumns = [
    `"leadId" TEXT`,
    `"leadSourceChannel" VARCHAR(50)`,
    `"leadSourceCampaign" VARCHAR(100)`,
    `"leadPriority" VARCHAR(20) DEFAULT 'MEDIA'`,
    `"leadScore" INTEGER DEFAULT 0`,
    `"leadIntention" TEXT`,
    `"leadQualification" TEXT`,
    `"leadResponsavelId" TEXT`,
  ];

  for (const col of quotationColumns) {
    const colName = col.split('"')[1];
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS ${col}`);
      console.log(`  + quotations.${colName} adicionado`);
    } catch (e: any) {
      console.log(`  - quotations.${colName} já existe ou erro: ${e.message}`);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "quotations_leadId_idx" ON "quotations"("leadId")`);
    console.log('  + quotations.leadId_idx criado');
  } catch (e: any) {
    console.log(`  - quotations.leadId_idx: ${e.message}`);
  }

  console.log('Migrations concluídas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao executar migrations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
