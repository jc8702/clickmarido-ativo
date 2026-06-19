# CHECKLIST PRÉ-PRODUÇÃO

Antes de colocar o sistema em uso real, verifique cada um destes itens para garantir a estabilidade do CRM.

### Database
- [ ] Conta na Neon.tech criada e projeto criado
- [ ] `schema.sql` executado sem erros
- [ ] Tabelas criadas (`users`, `customers`, `inventory`, `quotations`, `service_orders`, `payments`, `warranties`)
- [ ] `DATABASE_URL` adicionada ao `.env`

### Backend (Next.js API Routes)
- [ ] Dependências instaladas (`npm install` no diretório `frontend/`)
- [ ] Servidor de desenvolvimento sobe sem erros (`npm run dev`)
- [ ] Logs transacionais testados (criados em `/tmp/logs/` ou equivalente configurado)
- [ ] POST `/api/auth/login` retorna token JWT corretamente

### Frontend
- [ ] Tela de Login funcional (redireciona para /dashboard após sucesso)
- [ ] Dashboard exibe as KPIs corretamente sem estourar layout
- [ ] Telas de CRUD (Clientes, Estoque, Orçamentos) carregando os modais adequadamente
- [ ] Responsividade no Mobile está adequada para uso externo

### Vercel
- [ ] Repositório conectado ao painel da Vercel
- [ ] `DATABASE_URL` e `JWT_SECRET` preenchidos em Environment Variables
- [ ] Build e Deploy concluídos com sucesso (luz verde)
- [ ] URL da aplicação acessível na internet

### Testes
- [ ] E2E Completo: Criar Cliente -> Criar Orçamento -> Aprovar Orçamento -> Concluir OS -> Confirmar Pagamento
- [ ] Upload de fotos testado (Verificar Base64 validation)
- [ ] Teste de Concorrência: Alterar estoque funciona corretamente (Lock validado)
- [ ] Dados continuam no banco após o deploy ou atualização
