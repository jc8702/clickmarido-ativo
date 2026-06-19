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

## 4. TESTES BÁSICOS

Recomendamos fazer o E2E manual no ambiente de produção logo após o deploy:
1. Fazer **Login**
2. Criar um **Customer** (Cliente)
3. Criar uma **Quotation** (Orçamento)
4. Aprovar o Orçamento -> Gerar **Service Order** (OS)
5. Concluir a OS -> Gerar **Payment** (Pagamento)
6. Aprovar Pagamento
7. Verificar se o Dashboard reflete os valores e se o Webhook responde corretamente.
