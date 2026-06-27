const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Quotation:', await prisma.quotation.findFirst({where:{number:'2000017024851866'}}));
  console.log('ServiceOrder:', await prisma.serviceOrder.findFirst({where:{number:'2000017024851866'}}));
}

main().catch(console.error).finally(() => prisma.$disconnect());
