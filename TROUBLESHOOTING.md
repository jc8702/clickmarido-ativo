# TROUBLESHOOTING

Guia de resolução para problemas comuns durante a configuração e operação do Click Marido CRM.

### 1. "Erro: Cannot connect to Neon"
**Possível Causa:** `DATABASE_URL` incorreta ou IP bloqueado.
**Solução:**
- Verifique se a variável `CONNECTION_STRING` ou `DATABASE_URL` no `.env` está formatada corretamente.
- No console da Neon, verifique em *Security > IP Allowlist* se o seu IP atual tem permissão para acessar o banco, ou remova temporariamente a restrição para testar.

### 2. "Erro: Vercel build fails"
**Possível Causa:** Dependências ou variáveis de ambiente ausentes.
**Solução:**
- Verifique se você não está ignorando avisos de ESLint que podem interromper o build no Next.js (use `eslint --fix` localmente).
- Antes de fazer o push para o GitHub, rode `npm run build` na sua máquina local para confirmar que o erro não é de código.
- Garanta que variáveis críticas como `DATABASE_URL` estão nas *Environment Variables* da Vercel.

### 3. "Erro: JWT invalid"
**Possível Causa:** Assinatura do token falhou ou token corrompido no frontend.
**Solução:**
- Verifique se o `JWT_SECRET` é exatamente o mesmo tanto no banco/backend quanto nas variáveis da Vercel. Se mudar o secret, tokens antigos falham.
- Limpe o localStorage no navegador (F12 -> Application -> Local Storage) e faça login novamente.

### 4. "Erro: Upload não funciona"
**Possível Causa:** Limitação da Vercel Serverless para arquivos binários grandes ou permissão de pastas.
**Solução:**
- Nós configuramos o upload via *Base64* diretamente. Se ultrapassar 5MB (limite customizado no código), ele rejeitará a requisição.
- Tente subir uma imagem menor. Em ambiente Vercel, o Payload Max pode ser restritivo e o File System é Somente-Leitura (Read-Only). É sugerido usar Base64 string direto para o banco de dados (caso esteja salvando no banco) ou integrar com AWS S3 / Cloudinary posteriormente.

### 5. "Erro no fetch: Invalid URL ou ECONNREFUSED"
**Possível Causa:** O frontend está tentando acessar `http://localhost:3000` em produção.
**Solução:**
- Configure a variável `NEXT_PUBLIC_API_URL` na Vercel com o domínio da própria aplicação (ex: `https://clickmarido.vercel.app/api`).
