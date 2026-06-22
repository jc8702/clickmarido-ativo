# DEPLOY DO CRM CLICK MARIDO

Este documento descreve como realizar o setup e deploy do sistema CRM (construído com Next.js 15, usando App Router no Frontend e API Routes no Backend).

## 1. SETUP INICIAL (Local)

**Requisitos:**
- Node.js 18+
- git
- PostgreSQL (Neon ou local)

**Passo-a-passo:**
1. Clone o repositório:
   ```bash
   git clone <url-do-repo>
   cd clickmarido/frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha o `DATABASE_URL` e `JWT_SECRET`
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse: http://localhost:3000

## 2. NEON SETUP (Banco de Dados)

1. Crie uma conta e um projeto em [console.neon.tech](https://console.neon.tech).
2. Copie a string de conexão (`CONNECTION_STRING`).
3. Execute o script de schema no banco:
   ```bash
   psql "SuaConnectionStringAqui" < ../schema.sql
   ```
4. Verifique as tabelas criadas:
   ```bash
   psql "SuaConnectionStringAqui" -c "\dt"
   ```

## 3. VERCEL DEPLOY (Aplicação Completa)

Como unificamos Front e Back no Next.js, o deploy na Vercel abrange todo o sistema.

1. Conecte seu repositório GitHub ao painel da Vercel.
2. Na Vercel, vá nas configurações do projeto > **Environment Variables**.
3. Adicione todas as variáveis do seu `.env` local (ex: `DATABASE_URL`, `JWT_SECRET`, etc).
4. O deploy automático ocorrerá a cada push na branch `main`.

## 4. MÓDULO FINANCEIRO - SETUP

### 4.1 Variáveis de Ambiente (Mercado Pago)

1. Copie o arquivo de exemplo:
   ```bash
   cp financeiro/.env.example frontend/.env.local
   ```

2. Preencha as credenciais do Mercado Pago em `frontend/.env.local`:
   ```
   MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
   MERCADO_PAGO_CLIENT_ID=xxx
   MERCADO_PAGO_CLIENT_SECRET=xxx
   ```

3. **⚠️ NUNCA committar o arquivo `.env.local`** (já está no .gitignore)

### 4.2 Migração do Banco

```bash
cd frontend
npx prisma migrate dev --name add_financial_module_v2
npx prisma generate
```

### 4.3 Webhook Mercado Pago

1. Acesse o painel do Mercado Pago
2. Vá em **Configurações > Webhooks**
3. Adicione a URL: `https://seudominio.com/api/payments/webhook-mp`
4. Selecione eventos: `payment.created`, `payment.updated`

### 4.4 Testes do Módulo Financeiro

1. Criar uma **Quotation** com itens
2. Gerar **Invoice** a partir da quotation
3. Gerar **PIX** (via Mercado Pago)
4. Escanear QR Code e confirmar pagamento
5. Verificar se webhook atualizou status
6. Verificar Dashboard financeiro

---

## 5. TESTES BÁSICOS

Recomendamos fazer o E2E manual no ambiente de produção logo após o deploy:
1. Fazer **Login**
2. Criar um **Customer** (Cliente)
3. Criar uma **Quotation** (Orçamento)
4. Aprovar o Orçamento -> Gerar **Service Order** (OS)
5. Concluir a OS -> Gerar **Invoice** (Fatura)
6. Gerar pagamento via **PIX/Boleto** (Mercado Pago)
7. Confirmar pagamento (webhook)
8. Verificar se o Dashboard financeiro reflete os valores
