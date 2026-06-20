# RESUMO DE PROJETO: clickmarido-ativo

## Informações Gerais
- **Status Atual:** Em Configuração de Ambiente / Resolução de Build
- **Objetivo Central:** Preparar aplicação frontend Next.js 15 (App Router) para deploy Vercel e integração com DB Neon.
- **Última Atualização:** 20/06/2026 - 16:05

## Histórico de Alterações
- **[20/06/2026 - 16:05]:** Resolução de conflitos de rotas estáticas e dinâmicas (force-dynamic em `/new` e `/view`) e unificação do `tsconfig.json`. Build local do Next.js agora passa com 100% de sucesso. Servidor validado localmente, mas esbarra na ausência de banco de dados real.
  - Arquivos modificados: `frontend/tsconfig.json`, `frontend/app/(dashboard)/customers/new/page.tsx`, `frontend/app/(dashboard)/quotations/new/page.tsx`, `frontend/app/(dashboard)/quotations/view/page.tsx`

## TODOs / Próximos Passos
- [ ] Usuário criar a conta/projeto no Neon (PostgreSQL) para obter a string de conexão (`DATABASE_URL`).
- [ ] Usuário criar projeto na Vercel, importar o GitHub e configurar as variáveis de ambiente.
- [ ] Validar login e rotas de CRUD em produção após o banco ser populado.
