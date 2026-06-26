const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const user = {
    name: 'Click Marido',
    email: 'clickmarido@gmail.com',
    password: 'Millena@@2017@@',
    role: 'admin',
  };

  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    console.log(`[SKIP] ${user.email} já existe`);
    return;
  }

  const passwordHash = await bcrypt.hash(user.password, 10);
  await prisma.user.create({
    data: { name: user.name, email: user.email, passwordHash, role: user.role, active: true },
  });

  console.log(`[OK] Usuário criado: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
