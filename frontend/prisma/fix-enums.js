const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clean invalid qualificationStage values
  await prisma.$executeRawUnsafe(`UPDATE "leads" SET "qualificationStage" = 'SEM_VALIDACAO' WHERE "qualificationStage" NOT IN ('QUALIFICADO', 'PARCIALMENTE_QUALIFICADO', 'EM_VALIDACAO', 'DESQUALIFICADO', 'SEM_VALIDACAO')`);
  console.log('Dados limpos');
  
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" DROP DEFAULT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" TYPE "LeadQualificationStage" USING "qualificationStage"::text::"LeadQualificationStage"`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" SET DEFAULT 'SEM_VALIDACAO'`);
  console.log('qualificationStage convertido com sucesso');
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
