const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Limpando dados antigos de leads para permitir migração de enums...');
  try {
    await prisma.leadEvent.deleteMany();
    await prisma.leadAppointment.deleteMany();
    await prisma.operationalAlert.deleteMany();
    await prisma.lead.deleteMany();
    console.log('[OK] Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar tabelas:', error);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
