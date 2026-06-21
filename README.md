# Click Marido CRM

Sistema de gestão para serviços residenciais (elétrica, hidráulica, limpeza, reparos).

**Status:** MVP v1.0.0 - Funcional
**Última atualização:** 20/06/2026

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# 1. Clonar repo
git clone https://github.com/seu-repo/clickmarido-ativo.git
cd clickmarido-ativo

# 2. Configurar ambiente
cp frontend/.env.example frontend/.env.local
# Editar frontend/.env.local com seus valores:
# - DATABASE_URL do Neon
# - JWT_SECRET gerado

# 3. Instalar e rodar
npm install
npm run dev

# 4. Abrir browser
# http://localhost:3000
```

### Credenciais de Teste

- **Email:** jose@clickmarido.local
- **Senha:** 123456

## 📋 Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Validation:** Zod
- **Styling:** Tailwind CSS
- **Auth:** JWT

## 📁 Estrutura do Projeto

```
frontend/
├── app/
│   ├── api/           # API Routes (backend)
│   │   ├── auth/      # Autenticação JWT
│   │   ├── customers/ # CRUD de clientes
│   │   ├── quotations/# CRUD de orçamentos
│   │   └── warranties/# Garantias
│   └── (dashboard)/   # Páginas protegidas
├── hooks/             # React hooks (useAuth, useCustomers, etc)
├── lib/              # Utilitários (schemas.ts, etc)
├── prisma/           # Schema ORM
└── middleware.ts     # JWT middleware
```

## 🔐 Segurança

- Tokens JWT com expiração 7 dias
- Senhas armazenadas como placeholder (melhorar para produção)
- HTTPS obrigatório em produção (Vercel enforça)
- Database URL não exposta no cliente

## 🚀 Deploy em Produção (Vercel)

### 1. Preparar

```bash
# Commit final
git add -A
git commit -m "v1.0.0: MVP production-ready"
git push origin main
```

### 2. Conectar Vercel

1. Ir em https://vercel.com/new
2. Selecionar repositório do GitHub
3. Next.js será auto-detectado

### 3. Configurar Environment Variables

Na dashboard da Vercel, adicionar:
- `DATABASE_URL` (Neon PostgreSQL)
- `JWT_SECRET` (mesmo do desenvolvimento)

### 4. Deploy

Vercel fará deploy automático. Aguardar ~5 minutos.

## 📊 Banco de Dados (Neon)

### Modelos

- **Customer:** Clientes com nome, email, telefone
- **Quotation:** Orçamentos com items, total, status
- **Warranty:** Garantias associadas a orçamentos

### Migrations

```bash
# Criar nova migration
npx prisma migrate dev --name descricao

# Resetar banco (cuidado em produção!)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Build falha em Vercel

**Solução:**
- Verificar se `DATABASE_URL` está configurada em Vercel
- Rodar `npm run build` localmente para debug

### Banco não conecta

**Solução:**
- Verificar DATABASE_URL em `.env.local`
- Em Neon, adicionar seu IP em Security > IP Allowlist

## 📝 Próximas Melhorias

- [ ] PDF generation para orçamentos
- [ ] WhatsApp integration para enviar orçamentos
- [ ] Dashboard com gráficos de vendas
- [ ] Multi-usuário (adicionar novos usuários)
- [ ] Upload de fotos de clientes/serviços
- [ ] Assinatura digital em orçamentos
- [ ] Integração MercadoPago para pagamento

---

**v1.0.0** - 20/06/2026 - MVP Launch
