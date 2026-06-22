const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seed de Usuários ===\n');

  const users = [
    {
      name: 'Administrador',
      email: 'clickmarido@gmail.com',
      password: 'Millena@@2017@@',
      role: 'admin',
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`[SKIP] ${u.email} já existe`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);

    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        active: true,
      },
    });

    console.log(`[OK] ${u.email} | role: ${u.role}`);
  }

  console.log('\n--- Concluído ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
