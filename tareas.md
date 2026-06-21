# Backlog de Tarefas: Integração e Correção de Módulos (Click Marido CRM)

Checklist detalhado para acompanhamento do progresso da integração dos módulos ocultos e correção do módulo de pagamentos.

## 📁 Fase 1: Unificação da Navegação e Perfil
- [x] Atualizar links do menu em `app/(dashboard)/dashboard/page.tsx`
- [x] Atualizar links do menu em `app/(dashboard)/customers/page.tsx`
- [x] Atualizar links do menu em `app/(dashboard)/quotations/page.tsx`
- [x] Atualizar links do menu em `app/profile/page.tsx`
- [x] Adicionar link de redirecionamento para `/profile` no componente `<Navigation>` (`frontend/components/Navigation.tsx`) ao clicar nos dados do usuário

## 🛠️ Fase 2: Modernização do Módulo de Ordens de Serviço (`/service-orders`)
- [x] Remover `app/(dashboard)/service-orders/page.jsx`
- [x] Criar `app/(dashboard)/service-orders/page.tsx`
  - [x] Importar e integrar o componente `<Navigation>`
  - [x] Implementar listagem moderna de ordens com o componente `<Table>`
  - [x] Estilizar cartões e status badges em conformidade com o Design System
  - [x] Garantir tipagem em TypeScript estrita

## 💳 Fase 3: Correção e Ativação de Pagamentos (`/payments`)
- [x] Remover `app/(dashboard)/payments/page.jsx`
- [x] Criar `app/(dashboard)/payments/page.tsx`
  - [x] Importar e integrar o componente `<Navigation>`
  - [x] Estilizar com o novo Design System usando os componentes `<Table>`, `<Card>` e `<Button>`
- [x] Implementar a rota de API `/api/payments/route.ts`
  - [x] Obter orçamentos aprovados de forma dinâmica para simular faturamento/pagamentos pendentes
- [x] Implementar a rota de API `/api/payments/[id]/approve/route.ts`
  - [x] Alterar status do orçamento/ordem correspondente para aprovado/pago

## 🛡️ Fase 4: Ajuste do Módulo de Garantias (`/warranties`)
- [x] Redesenhar `app/warranties/page.tsx`
  - [x] Integrar paleta de cores (Roxo/Verde/Laranja) e Design System
  - [x] Integrar barra de navegação global

## 🚀 Fase 5: Build e Compilação Final
- [x] Executar build de produção (`npm run build`) na pasta `frontend/`
- [x] Verificar integridade do build e ausência de warnings/erros no console
