# CHECKLIST PRÉ-PRODUÇÃO

Antes de colocar o sistema em uso real, verifique cada um destes itens.

### Database
- [ ] Conta na Neon.tech criada
- [ ] `schema.sql` executado sem erros
- [ ] `DATABASE_URL` adicionada ao `.env`

### Build & Deploy
- [ ] `npm run build` passa sem erros (frontend)
- [ ] Repositório conectado ao painel da Vercel
- [ ] `DATABASE_URL` e `JWT_SECRET` em Environment Variables
- [ ] Build e Deploy concluídos (luz verde)

### Design System
- [ ] Cores (roxo/verde/laranja) consistentes em todas as páginas
- [ ] Gradientes hero/subtle/accent/dark/warning funcionando
- [ ] Animações fade-in, scale-in, slide-down suaves
- [ ] Botões com hover/active/loading states
- [ ] Badges com cores de status corretas
- [ ] Modal com animação scale-in
- [ ] Toast com auto-dismiss visível

### Páginas
- [ ] Login funcional (gradiente hero, Card)
- [ ] Dashboard com KPIs da API
- [ ] Clientes com busca por nome/email
- [ ] Orçamentos em Kanban (4 colunas)
- [ ] Perfil editável
- [ ] Service Orders com Badge de status
- [ ] Pagamentos com Badge de status

### Performance
- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 90+
- [ ] Contraste WCAG AA validado
- [ ] Animações não travam em dispositivos lentos

### Acessibilidade
- [ ] Navegação por teclado (Tab, Enter, Escape)
- [ ] ARIA labels em botões de fechar
- [ ] Focus ring visível em inputs e botões
- [ ] Contraste de cores OK (WCAG AA)

### Testes
- [ ] E2E: Cliente → Orçamento → Aprovar → Concluir OS → Pagamento
- [ ] Responsivo: mobile, tablet, desktop
- [ ] `/test` carrega todos os componentes sem erro

### Vercel
- [ ] Build production sem warnings
- [ ] URL da aplicação acessível
- [ ] Rotas dinâmicas funcionando (clientes/[id], orçamentos/[id])
