const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Criando usuário de teste ===\n');

  const testUser = {
    name: 'Teste API',
    email: 'teste@clickmarido.com.br',
    password: 'Teste@123',
    role: 'admin',
  };

  const existing = await prisma.user.findUnique({ where: { email: testUser.email } });
  if (existing) {
    console.log(`[SKIP] ${testUser.email} já existe`);
    console.log(`\nCredenciais:\n  Email: ${testUser.email}\n  Senha: ${testUser.password}`);
    return;
  }

  const passwordHash = await bcrypt.hash(testUser.password, 10);

  await prisma.user.create({
    data: {
      name: testUser.name,
      email: testUser.email,
      passwordHash,
      role: testUser.role,
      active: true,
    },
  });

  console.log(`[OK] Usuário criado com sucesso!\n`);
  console.log(`Credenciais:\n  Email: ${testUser.email}\n  Senha: ${testUser.password}\n  Role: ${testUser.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
