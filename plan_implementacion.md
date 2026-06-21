# Plano de Rota Técnica: Correção de Navegação e Integração dos Módulos Ocultos (Click Marido CRM)

Este plano descreve as etapas técnicas para integrar todos os módulos ocultos (Ordens de Serviço, Pagamentos, Garantias e Perfil) à navegação principal e corrigir os erros de API da tela de Pagamentos.

---

## 🎨 SQUAD DE ESPECIALISTAS (Mapeamento de Skills)

- **`@web-design-guidelines` (Auditor Visual e Temas)**: Validará a paleta de cores e o visual das novas páginas TypeScript (`service-orders/page.tsx` e `payments/page.tsx`) mantendo a harmonia do Design System.
- **`@code-reviewer` (Auditor de Componentes)**: Validará a migração de JSX para TSX das páginas de ordens e pagamentos, além da injeção consistente do componente `<Navigation>`.
- **`@webapp-testing` (Auditor de Rotas e Build)**: Responsável por testar a comunicação das APIs de pagamentos criadas e validar que o build do Next.js compila perfeitamente sem falhas.

---

## 📅 CRONOGRAMA E PASSOS DE EXECUÇÃO

### PASSO 1: Integração e Unificação da Barra de Navegação
1. Atualizar o array de links passado para o componente `<Navigation>` em todas as páginas principais (`dashboard`, `customers`, `quotations`, `profile`) para incluir:
   - Dashboard (`/dashboard`)
   - Clientes (`/customers`)
   - Orçamentos (`/quotations`)
   - Ordens de Serviço (`/service-orders`)
   - Pagamentos (`/payments`)
2. Atualizar o componente `<Navigation>` para tornar o bloco do usuário (nome e email) um link clicável direcionando para `/profile`.

### PASSO 2: Modernização do Módulo de Ordens de Serviço (`/service-orders`)
1. Remover o arquivo `.jsx` legado `app/(dashboard)/service-orders/page.jsx`.
2. Criar `app/(dashboard)/service-orders/page.tsx` totalmente tipado em TypeScript.
3. Importar e instanciar o componente `<Navigation>` com os links de navegação globais.
4. Aplicar os cards, tabelas e botões modernos baseados no Design System.

### PASSO 3: Resolução e Ativação do Módulo de Pagamentos (`/payments`)
1. Remover o arquivo `.jsx` legado `app/(dashboard)/payments/page.jsx`.
2. Criar `app/(dashboard)/payments/page.tsx` tipado em TypeScript, injetando `<Navigation>` e estilizando de acordo com o Design System.
3. Criar a rota de API `/api/payments/route.ts` para retornar os dados dos pagamentos (mapeados a partir dos orçamentos aprovados de forma dinâmica para evitar modificações complexas de DB caso escolhido pelo usuário).
4. Criar o endpoint PATCH `/api/payments/[id]/approve/route.ts` para aprovar o pagamento (atualizar status do orçamento relacionado).

### PASSO 4: Ajuste do Módulo de Garantias (`/warranties`)
1. Redesenhar `app/warranties/page.tsx` aplicando as cores roxo, verde e laranja do Design System.
2. Remover estilos inline antigos substituindo por classes de espaçamento e layout do Tailwind.
3. Adicionar o cabeçalho de navegação padrão.

### PASSO 5: Validação do Build
1. Acessar a pasta `frontend` e rodar o comando de compilação estática (`npm run build`).

---

## 💎 ESTÁNDAR DE DIAMANTE (Critérios de Aceitação)
- **Acessibilidade de Navegação**: Todos os 5 módulos principais devem ser acessíveis diretamente do menu de cabeçalho global.
- **Zero Erros 404**: Clicar em qualquer tela ou interagir (como gerar PIX / aprovar pagamento) não deve produzir erros de rede.
- **TypeScript Estrito**: Todas as páginas de visualização de rotas migradas de `.jsx` para `.tsx`.
