# Backlog de Tarefas: Revitalização UX/UI e Integração de Módulos (Click Marido CRM)

Checklist de acompanhamento para a revitalização e integração dinâmica de todas as telas.

## 🛠️ Fase 1: Resolução de Loops e Estabilidade
- [x] Estabilizar referências em `hooks/useAuth.js` com `useCallback`
- [x] Corrigir loop e remover `mutate()` concorrente em `app/(dashboard)/customers/page.tsx`
- [x] Corrigir loop e remover `mutate()` concorrente in `app/(dashboard)/quotations/page.tsx`
- [x] Criar componentes de esqueleto de carregamento (*shimmer loading*)

## 🎨 Fase 2: Revitalização do Dashboard e Menu Global
- [x] Estilizar o cabeçalho global (`Navigation.tsx`) com layout premium Glassmorphism e ícones SVG
- [x] Revitalizar o layout do Dashboard (`dashboard/page.tsx`) com Bento Grid, cards de estatísticas ricos e micro-animações

## 👥 Fase 3: Revitalização de Clientes e Orçamentos
- [x] Atualizar visual da tabela de Clientes com dados de endereço e contatos rápidos
- [x] Desenhar gaveta deslizante (Drawer) para detalhes do cliente em `customers/page.tsx`
- [x] Adicionar suporte a Prazo, Garantia, Descontos e Pagamento no `QuotationForm.tsx`
- [x] Corrigir mapeamento do item (chave `name` para `description`) no `QuotationForm.tsx`

## ⏳ Fase 4: Integração das Ordens de Serviço (OS)
- [x] Adicionar botão "Criar Ordem Manual" em `service-orders/page.tsx`
- [x] Criar modal e formulário rápido para gerar a OS manual
- [x] Integrar links da OS direcionando para Clientes e Orçamentos

## 💳 Fase 5: Integração do Módulo de Pagamentos
- [x] Adicionar botão "Registrar Recebimento Manual" em `payments/page.tsx`
- [x] Adicionar link direcionando para o Perfil do Cliente e a Ordem de Serviço na tabela de Pagamentos
- [x] Integrar atalho de compartilhamento rápido do código PIX via WhatsApp Web

## 🛡️ Fase 6: Integração do Módulo de Garantias
- [x] Adicionar botão "Acionar Garantia" na tabela/cards de Garantias em `warranties/page.tsx`
- [x] Implementar fluxo de acionamento que cria automaticamente uma nova OS de reparo sem custo (R$ 0,00) no backend
- [x] Integrar links direcionando para a visualização do Cliente e do Orçamento original

## 🚀 Fase 7: Build e Testes
- [x] Executar `npm run build` na pasta `frontend/`
- [x] Validar a ausência de warnings e integridade das rotas
