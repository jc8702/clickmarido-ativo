
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const technician = await prisma.technician.create({
      data: {
        name: 'JOSE CARLOS DA SILVA',
        email: 'jose.trabalho.bnu@gmail.com',
        phone: '47997896229',
        specialty: 'Elétrica',
        document: '06274520945',
        address: 'Rua Mônaco, 81',
        bio: '',
        hourlyRate: parseFloat('45'),
        hireDate: new Date('2026-07-02'),
        avatarUrl: null,
      },
    });
    console.log(technician);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.\();
  }
}
main();

