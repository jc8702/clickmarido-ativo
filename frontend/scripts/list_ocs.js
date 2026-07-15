const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOC003() {
  try {
    const ocs = await prisma.purchaseOrder.findMany({ select: { number: true } });
    console.log('Available OCs:', ocs.map(o => o.number));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOC003();
