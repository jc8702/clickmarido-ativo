import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Convertendo colunas restantes para enums...');

  try {
    await prisma.$executeRawUnsafe(`UPDATE "leads" SET "priority" = 'MEDIA' WHERE "priority" NOT IN ('BAIXA','MEDIA','ALTA','URGENTE')`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "priority" DROP DEFAULT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "priority" TYPE "LeadPriority" USING "priority"::text::"LeadPriority"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "priority" SET DEFAULT 'MEDIA'`);
    console.log('  + priority convertido');
  } catch (e: any) {
    console.log(`  - priority: ${e.message}`);
  }

  try {
    await prisma.$executeRawUnsafe(`UPDATE "leads" SET "qualificationStage" = 'SEM_VALIDACAO' WHERE "qualificationStage" IS NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" DROP DEFAULT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" TYPE "LeadQualificationStage" USING "qualificationStage"::text::"LeadQualificationStage"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "qualificationStage" SET DEFAULT 'SEM_VALIDACAO'`);
    console.log('  + qualificationStage convertido');
  } catch (e: any) {
    console.log(`  - qualificationStage: ${e.message}`);
  }

  console.log('Conversão concluída!');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
