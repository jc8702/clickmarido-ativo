const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.companySettings.findFirst();
  console.log('CompanySettings:', settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
