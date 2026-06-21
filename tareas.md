# Backlog de Tarefas: Auditoria do Redesign UX/UI (Click Marido CRM)

Checklist detalhado para acompanhamento do progresso da auditoria.

## 📁 Fase 1: Design System, Cores e Tokens
- [ ] Validar `frontend/tailwind.config.js`
  - [ ] Cores primárias (`primary` 50-900) e secundárias (`success` 50-900)
  - [ ] Cores terciárias (`warning` 50-900) e neutras (`neutral` 0-900)
  - [ ] Definição dos 5 gradientes de fundo (`gradient-hero`, `gradient-subtle`, `gradient-accent`, `gradient-dark`, `gradient-warning`)
  - [ ] Configuração de keyframes e classes de animação (`fade-in`, `slide-down`, `slide-up`, `scale-in`, `bounce-subtle`)
- [ ] Validar `frontend/lib/design-tokens.ts` (espaçamentos, tipografia, bordas, sombras, transições, z-indices)
- [ ] Validar `frontend/lib/gradient-utils.ts` (utilitários de gradientes, animações e sombras em TypeScript)
- [ ] Validar `frontend/lib/animations.css` (animações avançadas de shimmer, pulse-subtle, float, gradient-shift)
- [ ] Validar `frontend/DESIGN_SYSTEM.md` (documentação e guia visual de referência)
- [ ] Validar conformidade de contraste de acessibilidade (WCAG AA)

## 🧱 Fase 2: Componentes Core Reutilizáveis
- [ ] Validar `Button.tsx` (variantes primary/secondary/outline/danger/ghost, 5 tamanhos, loading spinner, fullWidth, ícone)
- [ ] Validar `Card.tsx` (shadows, gradients, sub-componentes: Header, Title, Description, Content, Footer, interactive hover)
- [ ] Validar `Input.tsx` (error state, helperText, ícone, label, required badge)
- [ ] Validar `Badge.tsx` (variants, sizes, remove icon)
- [ ] Validar `Modal.tsx` (portal modal, backdrop dismiss, animations scale/fade, overflow handle, sticky header/footer)
- [ ] Validar `Toast.tsx` (success/error/warning/info, auto-dismiss de 5s, slide-down animation)
- [ ] Validar `Navigation.tsx` (gradient dark, link ativo com bg-white/20, dados do usuário, botão de logout)
- [ ] Validar `Table.tsx` (overflow wrap, head com gradient subtle, row hover, cells, headers)
- [ ] Validar `FormBuilder.tsx` (suporte a textarea, select, text, email, phone, cascade delays em cascata)
- [ ] Validar exports unificados em `frontend/lib/index.ts`

## 🖥️ Fase 3: Layouts e Páginas
- [ ] Validar rota e página da Dashboard (`app/(dashboard)/dashboard/page.tsx`)
  - [ ] Integração do componente de navegação
  - [ ] Grid de 4 cartões de estatísticas com ícones e gradientes corretos
  - [ ] Lista de ordens de serviço recentes com badges de status
  - [ ] Bloco de performance com barra de progresso em gradiente
  - [ ] Menu de ações rápidas
- [ ] Validar rota e página de Clientes (`app/(dashboard)/customers/page.tsx`)
  - [ ] Campo de busca em tempo real
  - [ ] Tabela estilizada exibindo dados corretos dos clientes
  - [ ] Ações editar/deletar e botão Novo Cliente
- [ ] Validar rota e página de Orçamentos (`app/(dashboard)/quotations/page.tsx`)
  - [ ] Quadro Kanban com 4 colunas (Pendente, Enviado, Aprovado, Rejeitado)
  - [ ] Cards de orçamentos interativos com animações e badges
- [ ] Validar páginas acessórias (Login, Novo Cliente, Novo Orçamento, Perfil)
- [ ] Testar responsividade (Mobile, Tablet, Desktop) em todas as visualizações

## 🚀 Fase 4: Build e Compilação Final
- [ ] Executar build de produção (`npm run build`) na pasta `frontend/`
- [ ] Inspecionar console à procura de warnings ou erros
- [ ] Elaborar relatório final da auditoria sinalizando conformidade ou pendências
