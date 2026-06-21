# Plano de Rota Técnica: Auditoria do Redesign UX/UI (Click Marido CRM)

Este plano descreve a rota técnica que o Squad de Especialistas seguirá para verificar se o sistema Click Marido CRM está em conformidade com as regras e planos de redesign definidos.

---

## 🎨 SQUAD DE ESPECIALISTAS (Mapeamento de Skills)

- **`@web-design-guidelines` (Auditor Visual e Temas)**: Validará a paleta de cores (Roxo, Verde, Laranja), os 5 gradientes assinaturas (`gradient-hero`, `gradient-subtle`, `gradient-accent`, `gradient-dark`, `gradient-warning`), animações CSS e aplicação de fontes modernas (Inter / Plus Jakarta Sans).
- **`@code-reviewer` (Auditor de Componentes React/TS)**: Validará a estruturação dos 8 componentes reutilizáveis e do `FormBuilder`, verificando se contêm as variantes, tamanhos, estados e propriedades de forma semântica e sem cores hardcoded.
- **`@wcag-audit-patterns` (Auditor de Acessibilidade)**: Validará o contraste mínimo (WCAG AA 4.5:1), comportamento de foco, usabilidade do teclado nos modais e semântica HTML.
- **`@webapp-testing` (Auditor de Rotas e Build)**: Responsável por subir o servidor, validar a navegação e garantir que o build da Vercel / Next.js (`npm run build`) execute perfeitamente sem erros de compilação ou console.

---

## 📅 CRONOGRAMA E PASSOS DE EXECUÇÃO

### PASSO 1: Auditoria do Design System (Tokens e Tailwind Config)
1. Analisar se `frontend/tailwind.config.js` implementa todas as cores primárias, secundárias, alerta, neutros e gradientes especificados no ultraprompt 1.
2. Verificar se `frontend/lib/design-tokens.ts` e `frontend/lib/gradient-utils.ts` contêm os tokens de espaçamento, tipografia, bordas, sombras e as funções utilitárias de transição e gradiente.
3. Verificar a presença e consistência da documentação local em `frontend/DESIGN_SYSTEM.md`.

### PASSO 2: Auditoria dos Componentes Reutilizáveis (Foco no Ultra-Prompt 2)
1. Inspecionar `Button.tsx` (5 variantes, 5 tamanhos, loading spinner, fullWidth, suporte a ícone).
2. Inspecionar `Card.tsx` (shadows, gradients, compound components).
3. Inspecionar `Input.tsx` (error, helperText, icon, required badge).
4. Inspecionar `Badge.tsx` (variants, sizes, remove icon option).
5. Inspecionar `Modal.tsx` (backdrop dismiss, anims, scroll lock, dynamic footer).
6. Inspecionar `Toast.tsx` (success/error/warning/info states, timeout, entrance animation).
7. Inspecionar `Navigation.tsx` (gradient-dark background, active class active link).
8. Inspecionar `Table.tsx` (responsividade, head com subtle gradient, hover em row).
9. Inspecionar `FormBuilder.tsx` (renderização dinâmica, validações e animações em cascata).

### PASSO 3: Auditoria de Layouts e Rotas (Foco no Ultra-Prompt 3)
1. Analisar `frontend/app/(dashboard)/dashboard/page.tsx`: se os cartões de estatísticas usam os gradientes corretos, a lista de ordens de serviço usa Badges corretos, e se o componente de navegação está integrado.
2. Analisar `frontend/app/(dashboard)/customers/page.tsx`: se a tabela utiliza os componentes semânticos, a barra de busca funciona e as ações de editar/deletar estão integradas.
3. Analisar `frontend/app/(dashboard)/quotations/page.tsx`: se a visualização em Kanban de 4 colunas está renderizando com os badges e animações fade-in.

### PASSO 4: Teste de Build & Compilação Final
1. Acessar a pasta `frontend` e rodar o comando de verificação e build estático do Next.js.
2. Compilar os dados no relatório de auditoria e sugerir correções se necessário.

---

## 💎 ESTÁNDAR DE DIAMANTE (Critérios de Aceitação)
- **Zero cores hardcoded**: todas as cores devem usar as classes Tailwind ou tokens do Design System.
- **Build limpo**: `npm run build` deve rodar com 100% de sucesso.
- **Fidelidade visual**: conformidade total com os ultraprompts fornecidos.
