# Click Marido CRM - Frontend & Backend (Next.js)

Este é o diretório principal do CRM Click Marido, estruturado com **Next.js 15**. Ele contém tanto o Frontend (App Router) quanto o Backend (Pages API Routes).

## Stack
- **Frontend**: Next.js 15 (React), TailwindCSS, Axios
- **Backend**: Next.js API Routes, Node.js `pg`, JSON Web Tokens
- **Database**: PostgreSQL (Neon Tech)
- **Deployment**: Vercel

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente:
   Copie `.env.example` para `.env.local` e preencha as variáveis de ambiente:
   ```env
   DATABASE_URL="postgres://..."
   JWT_SECRET="seu-secret"
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000

## Build & Deploy

Para realizar o build local de produção:
```bash
npm run build
npm run start
```

O deploy para produção deve ser feito conectando este repositório à **Vercel**. 
A Vercel lidará tanto com as rotas do frontend quanto as funções serveless do backend automaticamente.
